"use server";

import { rmSync } from "fs";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { DeploymentSpec } from "./deployment-spec";
import { safeParseDeploymentSpec } from "./deployment-spec";
import { generateApp } from "./generator";
import { createRepoAndPush, deleteGitHubRepo, pushToExistingRepo } from "./github";
import {
  createCoolifyApplicationAndDeploy,
  deleteCoolifyApplication,
  getCoolifyApplication,
  getCoolifyDeployments,
  getDeploymentByUuid,
  isValidCoolifyDomain,
  setCoolifyApplicationEnv,
  triggerCoolifyDeploy,
  updateCoolifyApplication,
  waitForDeploymentCompletion,
} from "./coolify";
import { getTemplateSourcePath } from "./data";
import { getAppFactoryRootDomain, getCoolifyUrl } from "./env";

/** Input for createCustomer: insert into customers (platform_admin only per RLS). */
export type CreateCustomerInput = {
  name: string;
  legal_name?: string | null;
  primary_contact_name?: string | null;
  primary_contact_email?: string | null;
  notes?: string | null;
};

/** Input for submitLaunchSpec: wizard form state. */
export type LaunchSpecInput = {
  customer_id: string | null;
  tenant_id: string;
  template_id: string;
  template_version_id: string;
  app_name: string;
  app_slug: string;
  domain?: string | null;
  display_name?: string | null;
  support_email?: string | null;
  supabase_strategy: "shared_rls" | "shared_schema" | "dedicated_project";
  runtime_tier: "shared_multi_tenant" | "dedicated_app_shared_host" | "dedicated_runtime";
  auth_providers?: string[];
  redirect_urls?: string[];
  /** Template-specific config from manifest form_fields. */
  template_config?: Record<string, unknown> | null;
};

export type CreateCustomerResult =
  | { success: true; customer_id: string }
  | { success: false; error: string };

export type SubmitLaunchSpecResult =
  | { success: true; project_id: string; deployment_spec_id: string }
  | { success: false; error: string };

/** Create a customer. Requires platform_admin (RLS). */
export async function createCustomer(input: CreateCustomerInput): Promise<CreateCustomerResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { error, data } = await supabase
    .from("customers")
    .insert({
      name: input.name.trim(),
      legal_name: input.legal_name?.trim() || null,
      primary_contact_name: input.primary_contact_name?.trim() || null,
      primary_contact_email: input.primary_contact_email?.trim() || null,
      notes: input.notes?.trim() || null,
      status: "active",
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard/app-factory");
  revalidatePath("/dashboard/app-factory/launch");
  revalidatePath("/dashboard/app-factory/customers");
  return { success: true, customer_id: data.id };
}

/** Submit launch spec: create project, deployment_spec, and spec_generation job. */
export async function submitLaunchSpec(input: LaunchSpecInput): Promise<SubmitLaunchSpecResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const deploymentModel = input.runtime_tier;
  const { error: projectError, data: project } = await supabase
    .from("projects")
    .insert({
      tenant_id: input.tenant_id,
      customer_id: input.customer_id || null,
      name: input.app_name.trim(),
      slug: input.app_slug.trim(),
      template_id: input.template_id,
      template_version_id: input.template_version_id,
      deployment_model: deploymentModel,
      supabase_strategy: input.supabase_strategy,
      status: "draft",
    })
    .select("id")
    .single();

  if (projectError) {
    const isDuplicateSlug =
      (projectError as { code?: string }).code === "23505" ||
      projectError.message?.includes("projects_tenant_id_slug_key") ||
      projectError.message?.includes("duplicate key");
    const msg = isDuplicateSlug
      ? "An app with this slug already exists for this tenant. Choose a different App slug (e.g. my-app-2)."
      : projectError.message;
    return { success: false, error: msg };
  }
  const project_id = project.id;

  const spec: DeploymentSpec = {
    spec_version: "1",
    identity: {
      customer_id: input.customer_id || null,
      project_id,
      tenant_id: input.tenant_id,
    },
    app_metadata: {
      name: input.app_name.trim(),
      slug: input.app_slug.trim(),
      domain: input.domain?.trim() || undefined,
    },
    branding: input.display_name || input.support_email
      ? {
          display_name: input.display_name?.trim() || undefined,
          support_email: input.support_email?.trim() || undefined,
        }
      : undefined,
    auth: input.auth_providers?.length || input.redirect_urls?.length
      ? {
          providers: input.auth_providers,
          redirect_urls: input.redirect_urls,
        }
      : undefined,
    data: {
      supabase_strategy: input.supabase_strategy,
    },
    deployment: {
      runtime_tier: input.runtime_tier,
    },
    ...(input.template_config && Object.keys(input.template_config).length > 0
      ? { template_config: input.template_config }
      : {}),
  };

  const parsed = safeParseDeploymentSpec(spec);
  if (!parsed.success) {
    const parts = parsed.error.errors?.map((e) => {
      const path = e.path?.length ? `${e.path.join(".")}: ` : "";
      return `${path}${e.message}`;
    }) ?? [];
    let msg = parts.length > 0 ? parts.join("; ") : "Validation failed.";
    if (msg.toLowerCase().includes("slug")) {
      msg += " App slug must be lowercase letters, numbers, and hyphens only (e.g. my-app).";
    }
    return { success: false, error: msg };
  }

  const { error: specError, data: specRow } = await supabase
    .from("deployment_specs")
    .insert({
      project_id,
      spec_version: "1",
      spec_json: parsed.data as unknown as Record<string, unknown>,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (specError) return { success: false, error: specError.message };
  const deployment_spec_id = specRow.id;

  const { error: jobError } = await supabase.from("provisioning_jobs").insert({
    project_id,
    job_type: "spec_generation",
    status: "success",
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
  });

  if (jobError) return { success: false, error: jobError.message };

  revalidatePath("/dashboard/app-factory");
  revalidatePath("/dashboard/app-factory/launch");
  revalidatePath("/dashboard/app-factory/projects");
  return { success: true, project_id, deployment_spec_id };
}

export type RunLaunchPipelineResult =
  | {
      success: true;
      repoUrl?: string;
      applicationUuid?: string;
      message?: string;
      /** Coolify deployment final status (e.g. success, failed). */
      deploymentStatus?: string;
      /** Live app URL from Coolify (deployment_url). */
      deploymentUrl?: string | null;
      /** Build/deploy logs (tail) for display. */
      deploymentLogs?: string | null;
      /** Coolify deployment UUID. */
      deploymentUuid?: string | null;
    }
  | { success: false; error: string; step?: string; repoUrl?: string; deploymentStatus?: string; deploymentLogs?: string | null };

/**
 * Run the full pipeline for a project: code generation → GitHub repo create/push → Coolify deploy.
 * Loads the latest deployment_spec for the project and creates/updates provisioning_jobs.
 */
export async function runLaunchPipeline(projectId: string): Promise<RunLaunchPipelineResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated.", step: "auth" };

  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("id, template_id, template_registry(template_key)")
    .eq("id", projectId)
    .single();

  if (projectError || !projectRow) {
    return { success: false, error: projectError?.message ?? "Project not found.", step: "project" };
  }

  const templateKey =
    (projectRow.template_registry as { template_key?: string } | null)?.template_key ?? null;

  const { data: specRow, error: specError } = await supabase
    .from("deployment_specs")
    .select("id, spec_json")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (specError || !specRow) {
    return { success: false, error: specError?.message ?? "Deployment spec not found.", step: "spec" };
  }

  const spec = specRow.spec_json as DeploymentSpec;
  const slug = spec.app_metadata?.slug ?? "app";
  const appName = spec.app_metadata?.name ?? slug;

  let outputDir: string | null = null;

  const jobInsert = async (jobType: string, status: string) => {
    await supabase.from("provisioning_jobs").insert({
      project_id: projectId,
      job_type: jobType,
      status,
      started_at: status === "running" ? new Date().toISOString() : null,
      finished_at: status !== "running" && status !== "pending" ? new Date().toISOString() : null,
    });
  };

  const jobUpdate = async (jobType: string, status: string) => {
    const { data: jobs } = await supabase
      .from("provisioning_jobs")
      .select("id")
      .eq("project_id", projectId)
      .eq("job_type", jobType)
      .eq("status", "running")
      .order("created_at", { ascending: false })
      .limit(1);
    if (jobs?.[0]) {
      await supabase
        .from("provisioning_jobs")
        .update({
          status,
          finished_at: new Date().toISOString(),
        })
        .eq("id", jobs[0].id);
    }
  };

  try {
    await jobInsert("code_generation", "running");
    const templatePath = await getTemplateSourcePath(templateKey ?? "");
    const genResult = generateApp({
      spec,
      templateKey,
      templatePath: templatePath ?? undefined,
    });
    if (!genResult.success) {
      await jobUpdate("code_generation", "failed");
      return { success: false, error: `Code generation: ${genResult.error}`, step: "code_generation" };
    }
    outputDir = genResult.outputDir;
    await jobUpdate("code_generation", "success");

    await jobInsert("repo_push", "running");
    const repoResult = await createRepoAndPush(genResult.outputDir, slug, { description: appName });
    if (outputDir) {
      try {
        rmSync(outputDir, { recursive: true });
      } catch {
        // ignore cleanup errors
      }
    }
    if (!repoResult.success) {
      await jobUpdate("repo_push", "failed");
      return { success: false, error: `GitHub: ${repoResult.error}`, step: "repo_push" };
    }
    await jobUpdate("repo_push", "success");

    await supabase
      .from("projects")
      .update({ github_repo_url: repoResult.repoUrl, updated_at: new Date().toISOString() })
      .eq("id", projectId);

    await jobInsert("coolify_deploy", "running");
    const explicitDomain = spec.app_metadata?.domain?.trim() || null;
    const rootDomain = getAppFactoryRootDomain();
    const effectiveDomain =
      (explicitDomain && isValidCoolifyDomain(explicitDomain))
        ? explicitDomain
        : rootDomain
          ? `${slug.toLowerCase().replace(/[^a-z0-9-]/g, "-")}.${rootDomain}`
          : null;
    const coolifyResult = await createCoolifyApplicationAndDeploy({
      repoUrl: repoResult.repoUrl,
      branch: repoResult.defaultBranch,
      appName,
      coolify_project_uuid: spec.deployment?.coolify_project_uuid ?? null,
      coolify_server_uuid: spec.deployment?.coolify_server_uuid ?? null,
      coolify_environment_uuid: spec.deployment?.coolify_environment_uuid ?? null,
      domain: effectiveDomain,
      coolify_host_port: spec.deployment?.coolify_host_port ?? null,
      usedTemplate: genResult.usedTemplate ?? null,
    });
    if (!coolifyResult.success) {
      await jobUpdate("coolify_deploy", "failed");
      return {
        success: false,
        error: `Coolify: ${coolifyResult.error}`,
        step: "coolify_deploy",
        repoUrl: repoResult.repoUrl,
      };
    }

    if (effectiveDomain) {
      const rootForEnv = rootDomain ?? "moodmnky.com";
      const envResult = await setCoolifyApplicationEnv(coolifyResult.applicationUuid, {
        NEXT_PUBLIC_ROOT_DOMAIN: rootForEnv,
        NEXT_PUBLIC_APP_URL: `https://${effectiveDomain}`,
      });
      if (!envResult.success) {
        console.warn("Coolify env vars not set (app may show wrong domain until redeploy):", envResult.error);
      }
    }

    const waitResult = await waitForDeploymentCompletion(coolifyResult.applicationUuid, {
      timeoutMs: 25 * 60 * 1000,
      pollIntervalMs: 5000,
      maxWaitForDeploymentStartMs: 120 * 1000,
    });

    const deploymentDetail = waitResult.success
      ? waitResult.deployment
      : waitResult.deployment
        ? { ...waitResult.deployment, status: waitResult.deployment.status || "timeout" }
        : null;

    const deploymentStatus = deploymentDetail?.status ?? (waitResult.success ? undefined : "timeout");
    const deploymentUrl = deploymentDetail?.deployment_url ?? null;
    const deploymentLogs = deploymentDetail?.logs ?? null;
    const deploymentUuid = deploymentDetail?.deployment_uuid ?? null;

    const buildSucceeded =
      deploymentStatus != null &&
      ["success", "succeeded", "finished"].includes(deploymentStatus.toLowerCase().trim());

    await jobUpdate("coolify_deploy", buildSucceeded ? "success" : deploymentDetail ? "failed" : "success");

    await supabase
      .from("projects")
      .update({
        status: "generated",
        coolify_application_uuid: coolifyResult.applicationUuid,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    await supabase.from("releases").insert({
      project_id: projectId,
      environment_name: "production",
      deployment_spec_id: specRow.id,
      git_commit_sha: repoResult.commitSha ?? null,
      git_tag: repoResult.tag ?? null,
      status: buildSucceeded ? "live" : "failed",
      deployed_at: new Date().toISOString(),
    });

    revalidatePath("/dashboard/app-factory");
    revalidatePath("/dashboard/app-factory/launch");
    revalidatePath("/dashboard/app-factory/projects");

    return {
      success: true,
      repoUrl: repoResult.repoUrl,
      applicationUuid: coolifyResult.applicationUuid,
      message: buildSucceeded
        ? "Application created and build succeeded."
        : deploymentDetail
          ? `Deploy finished with status: ${deploymentStatus}.`
          : coolifyResult.message,
      deploymentStatus: deploymentStatus ?? undefined,
      deploymentUrl: deploymentUrl ?? undefined,
      deploymentLogs: deploymentLogs ?? undefined,
      deploymentUuid: deploymentUuid ?? undefined,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (outputDir) {
      try {
        rmSync(outputDir, { recursive: true });
      } catch {
        // ignore
      }
    }
    return { success: false, error: `Pipeline: ${msg}`, step: "pipeline" };
  }
}

export type RunPullChangesResult =
  | { success: true; message: string }
  | { success: false; error: string };

/**
 * Pull template changes: regenerate from current template, push to existing repo, trigger Coolify redeploy.
 * Requires project to already have github_repo_url and coolify_application_uuid.
 */
export async function runPullChanges(projectId: string): Promise<RunPullChangesResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("id, github_repo_url, coolify_application_uuid, template_id, template_registry(template_key)")
    .eq("id", projectId)
    .single();

  if (projectError || !projectRow) {
    return { success: false, error: projectError?.message ?? "Project not found." };
  }

  const repoUrl = projectRow.github_repo_url as string | null;
  const appUuid = projectRow.coolify_application_uuid as string | null;
  if (!repoUrl?.trim() || !appUuid?.trim()) {
    return {
      success: false,
      error: "Project must be deployed first (has GitHub repo and Coolify app). Use the Launch Wizard to run the pipeline.",
    };
  }

  const templateKey =
    (projectRow.template_registry as { template_key?: string } | null)?.template_key ?? null;

  const { data: specRow, error: specError } = await supabase
    .from("deployment_specs")
    .select("id, spec_json")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (specError || !specRow) {
    return { success: false, error: specError?.message ?? "Deployment spec not found." };
  }

  const spec = specRow.spec_json as DeploymentSpec;
  let outputDir: string | null = null;

  try {
    const templatePath = await getTemplateSourcePath(templateKey ?? "");
    const genResult = generateApp({
      spec,
      templateKey,
      templatePath: templatePath ?? undefined,
    });
    if (!genResult.success) {
      return { success: false, error: `Code generation: ${genResult.error}` };
    }
    outputDir = genResult.outputDir;

    const pushResult = await pushToExistingRepo(genResult.outputDir, repoUrl.trim());
    if (outputDir) {
      try {
        rmSync(outputDir, { recursive: true });
      } catch {
        // ignore
      }
    }
    if (!pushResult.success) {
      return { success: false, error: `GitHub: ${pushResult.error}` };
    }

    const triggerResult = await triggerCoolifyDeploy(appUuid);
    if (!triggerResult.success) {
      return { success: false, error: `Coolify: ${triggerResult.error}` };
    }

    revalidatePath("/dashboard/app-factory/projects");
    return {
      success: true,
      message: "Template changes pushed and redeploy triggered. Deployment status will update below.",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (outputDir) {
      try {
        rmSync(outputDir, { recursive: true });
      } catch {
        // ignore
      }
    }
    return { success: false, error: msg };
  }
}

export type CoolifyAppStatusResult =
  | { success: true; app: { uuid: string; name?: string; status?: string; fqdn?: string }; coolifyBaseUrl: string | null }
  | { success: false; error: string };

/** Fetch Coolify application status and FQDN for display. coolifyBaseUrl can be used for "Open in Coolify" link. */
export async function getCoolifyAppStatus(applicationUuid: string): Promise<CoolifyAppStatusResult> {
  const result = await getCoolifyApplication(applicationUuid);
  if (!result.success) return result;
  const coolifyBaseUrl = getCoolifyUrl();
  return {
    success: true,
    app: result.app,
    coolifyBaseUrl: coolifyBaseUrl ?? null,
  };
}

export type CoolifyDeploymentProgressResult =
  | {
      success: true;
      status: string;
      deploymentUrl: string | null;
      logs: string | null;
      deploymentUuid: string | null;
      applicationName?: string;
      commit?: string;
      createdAt?: string;
      updatedAt?: string;
      coolifyBaseUrl: string | null;
    }
  | { success: false; error: string };

/**
 * Get current deployment progress for an application (latest deployment).
 * Use for polling during/after deploy to show status, logs, and final URL.
 */
export async function getCoolifyDeploymentProgress(
  applicationUuid: string
): Promise<CoolifyDeploymentProgressResult> {
  const coolifyBaseUrl = getCoolifyUrl();
  const listResult = await getCoolifyDeployments(applicationUuid, 1);
  if (!listResult.success) return listResult;
  const latest = listResult.deployments[0];
  if (!latest?.uuid) {
    return {
      success: true,
      status: "pending",
      deploymentUrl: null,
      logs: null,
      deploymentUuid: null,
      coolifyBaseUrl: coolifyBaseUrl ?? null,
    };
  }
  const detailResult = await getDeploymentByUuid(latest.uuid);
  if (!detailResult.success) return detailResult;
  const d = detailResult.deployment;
  return {
    success: true,
    status: d.status,
    deploymentUrl: d.deployment_url ?? null,
    logs: d.logs ?? null,
    deploymentUuid: d.deployment_uuid,
    applicationName: d.application_name,
    commit: d.commit,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    coolifyBaseUrl: coolifyBaseUrl ?? null,
  };
}

export type FixCoolifyConfigResult = { success: true } | { success: false; error: string };

/**
 * Fix Coolify app stuck in restart loop (/bin/bash -c: option requires an argument).
 * Sets install/build/start commands for Platforms (pnpm) and optional domain (https://), then triggers a new deploy.
 */
export async function fixCoolifyApplicationConfig(
  applicationUuid: string,
  options?: { domain?: string | null }
): Promise<FixCoolifyConfigResult> {
  const updateResult = await updateCoolifyApplication(applicationUuid, {
    install_command: "pnpm install",
    build_command: "pnpm build",
    start_command: "pnpm start",
    domains: options?.domain?.trim() ? options.domain.trim() : undefined,
  });
  if (!updateResult.success) return updateResult;
  return triggerCoolifyDeploy(applicationUuid);
}

export type DeleteCoolifyDeploymentResult =
  | { success: true }
  | { success: false; error: string };

/** Delete the Coolify application for a project and clear coolify_application_uuid. */
export async function deleteCoolifyDeployment(projectId: string): Promise<DeleteCoolifyDeploymentResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("id, coolify_application_uuid, github_repo_url")
    .eq("id", projectId)
    .single();

  if (fetchError || !project) return { success: false, error: fetchError?.message ?? "Project not found." };
  const appUuid = project.coolify_application_uuid as string | null;
  if (!appUuid?.trim()) {
    await supabase.from("projects").update({ updated_at: new Date().toISOString() }).eq("id", projectId);
    revalidatePath("/dashboard/app-factory/projects");
    return { success: true };
  }

  const deleteResult = await deleteCoolifyApplication(appUuid, {
    delete_configurations: true,
    delete_volumes: true,
  });
  if (!deleteResult.success) return deleteResult;

  const { error: updateError } = await supabase
    .from("projects")
    .update({ coolify_application_uuid: null, updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (updateError) return { success: false, error: updateError.message };
  revalidatePath("/dashboard/app-factory/projects");
  return { success: true };
}

export type DeleteProjectResult =
  | { success: true; warning?: string }
  | { success: false; error: string };

/**
 * Full teardown: remove Coolify app, delete GitHub repo (best-effort), then delete the project row.
 * GitHub repo deletion is attempted whenever the project has github_repo_url; on failure we still
 * remove the project from our DB and return success with a warning so the app doesn't retain bloat.
 */
export async function deleteProject(projectId: string): Promise<DeleteProjectResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("id, coolify_application_uuid, github_repo_url")
    .eq("id", projectId)
    .single();

  if (fetchError || !project) return { success: false, error: fetchError?.message ?? "Project not found." };

  const appUuid = project.coolify_application_uuid as string | null;
  if (appUuid?.trim()) {
    const { deleteCoolifyApplication } = await import("./coolify");
    const delCoolify = await deleteCoolifyApplication(appUuid, {
      delete_configurations: true,
      delete_volumes: true,
    });
    if (!delCoolify.success) return { success: false, error: `Coolify: ${delCoolify.error}` };
  }

  let warning: string | undefined;
  const repoUrl = project.github_repo_url as string | null;
  if (repoUrl?.trim()) {
    const delRepo = await deleteGitHubRepo(repoUrl);
    if (!delRepo.success) {
      warning = `GitHub repository could not be removed: ${delRepo.error}. You may delete it manually: ${repoUrl}`;
    }
  }

  const { error: deleteError } = await supabase.from("projects").delete().eq("id", projectId);
  if (deleteError) return { success: false, error: deleteError.message };
  revalidatePath("/dashboard/app-factory/projects");
  return warning ? { success: true, warning } : { success: true };
}

export type AppFactoryProjectRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  coolify_application_uuid: string | null;
  created_at: string | null;
};

/** List projects for the current user (tenant-scoped via RLS). */
export async function getAppFactoryProjects(): Promise<
  { success: true; projects: AppFactoryProjectRow[] } | { success: false; error: string }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: rows, error } = await supabase
    .from("projects")
    .select("id, name, slug, status, coolify_application_uuid, created_at")
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  const projects: AppFactoryProjectRow[] = (rows ?? []).map((r) => ({
    id: r.id,
    name: r.name ?? "",
    slug: r.slug ?? "",
    status: r.status ?? "draft",
    coolify_application_uuid: r.coolify_application_uuid ?? null,
    created_at: r.created_at ?? null,
  }));
  return { success: true, projects };
}
