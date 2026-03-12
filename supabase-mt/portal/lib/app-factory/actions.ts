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
  createCoolifyApplicationFromComposeRaw,
  deleteCoolifyApplication,
  getCoolifyApplication,
  createCoolifyProject,
  getCoolifyApplicationLogs,
  getCoolifyDeployments,
  getDeploymentByUuid,
  isValidCoolifyDomain,
  listCoolifyApplicationsByProjectUuid,
  listCoolifyProjects,
  setCoolifyApplicationEnv,
  triggerCoolifyDeploy,
  updateCoolifyApplication,
  waitForDeploymentCompletion,
} from "./coolify";
import { getComposeContentByTemplateKey, syncComposeStackFromSource } from "./compose-stacks";
import { getDeploymentStepFromStatusAndLogs, type DeploymentStepIndex } from "./deployment-steps";
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
    const parts = (parsed.error as { issues?: Array<{ path?: (string | number)[]; message: string }> }).issues?.map((e: { path?: (string | number)[]; message: string }) => {
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

  const { error: auditError } = await supabase.from("app_factory_audit_log").insert({
    action: "project_created",
    project_id,
    actor_id: user.id,
    metadata: {
      name: input.app_name.trim(),
      slug: input.app_slug.trim(),
      tenant_id: input.tenant_id,
      template_id: input.template_id,
    },
  });
  if (auditError) {
    console.warn("App Factory audit log (project_created) failed:", auditError.message);
  }

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

    const explicitDomain = spec.app_metadata?.domain?.trim() || null;
    const rootDomain = getAppFactoryRootDomain();
    const effectiveDomain =
      (explicitDomain && isValidCoolifyDomain(explicitDomain))
        ? explicitDomain
        : rootDomain
          ? `${slug.toLowerCase().replace(/[^a-z0-9-]/g, "-")}.${rootDomain}`
          : null;

    let repoUrl: string | null = null;
    let commitSha: string | null = null;
    let tag: string | null = null;

    if (genResult.usedTemplate === "compose") {
      await jobInsert("repo_push", "success");
      const composeContent = await getComposeContentByTemplateKey(templateKey ?? "");
      if (!composeContent?.trim()) {
        await jobUpdate("code_generation", "failed");
        return {
          success: false,
          error:
            "Compose stack not found for this template. Sync compose from repo first (Admin → App Factory or run syncComposeStackFromSource for this template).",
          step: "code_generation",
        };
      }
      if (outputDir) {
        try {
          rmSync(outputDir, { recursive: true });
        } catch {
          // ignore
        }
      }
      await jobInsert("coolify_deploy", "running");
      let coolifyProjectUuid = spec.deployment?.coolify_project_uuid ?? null;
      if (!coolifyProjectUuid && spec.identity?.tenant_id) {
        const resolved = await getOrCreateCoolifyProjectForTenant(spec.identity.tenant_id);
        if (resolved.success) coolifyProjectUuid = resolved.coolify_project_uuid;
      }
      const coolifyResult = await createCoolifyApplicationFromComposeRaw({
        docker_compose_raw: composeContent,
        appName,
        coolify_project_uuid: coolifyProjectUuid,
        coolify_server_uuid: spec.deployment?.coolify_server_uuid ?? null,
        coolify_environment_uuid: spec.deployment?.coolify_environment_uuid ?? null,
        domain: effectiveDomain,
        instant_deploy: true,
      });
      if (!coolifyResult.success) {
        await jobUpdate("coolify_deploy", "failed");
        return {
          success: false,
          error: `Coolify: ${coolifyResult.error}`,
          step: "coolify_deploy",
        };
      }
      repoUrl = null;
      const projectUpdate: { github_repo_url?: string | null; updated_at: string } = {
        updated_at: new Date().toISOString(),
      };
      await supabase.from("projects").update(projectUpdate).eq("id", projectId);

      if (effectiveDomain) {
        const rootForEnv = rootDomain ?? "moodmnky.com";
        const envResult = await setCoolifyApplicationEnv(coolifyResult.applicationUuid, {
          NEXT_PUBLIC_ROOT_DOMAIN: rootForEnv,
          NEXT_PUBLIC_APP_URL: `https://${effectiveDomain}`,
        });
        if (!envResult.success) {
          console.warn("Coolify env vars not set:", envResult.error);
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
        git_commit_sha: null,
        git_tag: null,
        status: buildSucceeded ? "live" : "failed",
        deployed_at: new Date().toISOString(),
      });
      revalidatePath("/dashboard/app-factory");
      revalidatePath("/dashboard/app-factory/launch");
      revalidatePath("/dashboard/app-factory/projects");
      return {
        success: true,
        repoUrl: undefined,
        applicationUuid: coolifyResult.applicationUuid,
        message: buildSucceeded
          ? "Compose application created and deploy succeeded."
          : deploymentDetail
            ? `Deploy finished with status: ${deploymentStatus}.`
            : coolifyResult.message,
        deploymentStatus: deploymentStatus ?? undefined,
        deploymentUrl: deploymentUrl ?? undefined,
        deploymentLogs: deploymentLogs ?? undefined,
        deploymentUuid: deploymentUuid ?? undefined,
      };
    }

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
    repoUrl = repoResult.repoUrl;
    commitSha = repoResult.commitSha ?? null;
    tag = repoResult.tag ?? null;

    await supabase
      .from("projects")
      .update({ github_repo_url: repoResult.repoUrl, updated_at: new Date().toISOString() })
      .eq("id", projectId);

    await jobInsert("coolify_deploy", "running");
    let coolifyProjectUuid = spec.deployment?.coolify_project_uuid ?? null;
    if (!coolifyProjectUuid && spec.identity?.tenant_id) {
      const resolved = await getOrCreateCoolifyProjectForTenant(spec.identity.tenant_id);
      if (resolved.success) coolifyProjectUuid = resolved.coolify_project_uuid;
    }
    const coolifyResult = await createCoolifyApplicationAndDeploy({
      repoUrl: repoResult.repoUrl,
      branch: repoResult.defaultBranch,
      appName,
      coolify_project_uuid: coolifyProjectUuid,
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
      git_commit_sha: commitSha,
      git_tag: tag,
      status: buildSucceeded ? "live" : "failed",
      deployed_at: new Date().toISOString(),
    });

    revalidatePath("/dashboard/app-factory");
    revalidatePath("/dashboard/app-factory/launch");
    revalidatePath("/dashboard/app-factory/projects");

    return {
      success: true,
      repoUrl: repoUrl ?? undefined,
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

export type GetCoolifyLogsResult =
  | { success: true; logs: string }
  | { success: false; error: string };

/**
 * Fetch Coolify application logs for a project. User must have access to the project (RLS).
 * Fails if the app is not running (Coolify returns 400).
 */
export async function getCoolifyLogsForProject(
  projectId: string,
  lines = 300
): Promise<GetCoolifyLogsResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("id, coolify_application_uuid")
    .eq("id", projectId)
    .single();

  if (fetchError || !project) return { success: false, error: fetchError?.message ?? "Project not found." };
  const appUuid = project.coolify_application_uuid as string | null;
  if (!appUuid?.trim()) return { success: false, error: "Project has no Coolify application." };

  return getCoolifyApplicationLogs(appUuid, Math.max(1, Math.min(2000, lines)));
}

/**
 * Fetch Coolify application logs by application UUID. Platform admin only.
 * Use for debugging any Coolify app (e.g. compose stack) when you have the UUID from Coolify or --list.
 */
export async function getCoolifyLogsByApplicationUuid(
  applicationUuid: string,
  lines = 500
): Promise<GetCoolifyLogsResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: isAdmin } = await supabase.rpc("is_platform_admin", { p_user_id: user.id });
  if (!isAdmin) return { success: false, error: "Platform admin only." };

  if (!applicationUuid?.trim()) return { success: false, error: "Application UUID is required." };

  return getCoolifyApplicationLogs(applicationUuid.trim(), Math.max(1, Math.min(2000, lines)));
}

export type GetOrCreateCoolifyProjectResult =
  | { success: true; coolify_project_uuid: string }
  | { success: false; error: string };

/**
 * Resolve Coolify project UUID for a tenant (namespace for that tenant's apps).
 * If tenant has coolify_project_uuid, return it. Else list Coolify projects and match by name (tenant name/slug);
 * if found, save to tenant and return. Else create a new Coolify project, save to tenant, and return.
 * Caller must have access to the tenant (e.g. tenant admin running deploy).
 */
export async function getOrCreateCoolifyProjectForTenant(
  tenantId: string
): Promise<GetOrCreateCoolifyProjectResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, slug, name, coolify_project_uuid")
    .eq("id", tenantId)
    .single();

  if (tenantError || !tenant) {
    return { success: false, error: tenantError?.message ?? "Tenant not found." };
  }

  const existing = (tenant as { coolify_project_uuid?: string | null }).coolify_project_uuid;
  if (existing?.trim()) {
    return { success: true, coolify_project_uuid: existing.trim() };
  }

  const listRes = await listCoolifyProjects();
  if (!listRes.success) return { success: false, error: listRes.error };

  const slug = (tenant as { slug?: string }).slug ?? "";
  const name = (tenant as { name?: string }).name ?? slug;
  const nameLower = name.trim().toLowerCase();
  const slugLower = slug.trim().toLowerCase();
  const existingProject = listRes.projects.find(
    (p) =>
      (p.name ?? "").trim().toLowerCase() === nameLower ||
      (p.name ?? "").trim().toLowerCase() === slugLower
  );
  if (existingProject?.uuid) {
    const { error: updateErr } = await supabase
      .from("tenants")
      .update({
        coolify_project_uuid: existingProject.uuid,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenantId);
    if (updateErr) {
      console.warn("Failed to persist Coolify project UUID on tenant:", updateErr.message);
    }
    return { success: true, coolify_project_uuid: existingProject.uuid };
  }

  const createRes = await createCoolifyProject(
    name.trim() || slug.trim() || `tenant-${tenantId.slice(0, 8)}`,
    `App Factory namespace for tenant ${slug || tenantId}`
  );
  if (!createRes.success) return createRes;

  const { error: updateErr } = await supabase
    .from("tenants")
    .update({
      coolify_project_uuid: createRes.uuid,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tenantId);
  if (updateErr) {
    return { success: false, error: `Coolify project created but failed to save to tenant: ${updateErr.message}` };
  }
  return { success: true, coolify_project_uuid: createRes.uuid };
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
      /** 0–4 for multi-step progress meter (Queued → Preparing → Building → Deploying → Live). */
      deploymentStepIndex: DeploymentStepIndex;
      deploymentStepLabel: string;
    }
  | { success: false; error: string };

/**
 * Get current deployment progress for an application (latest deployment).
 * Poll this to drive a multi-step progress meter; returns status, logs, URL, and inferred step.
 */
export async function getCoolifyDeploymentProgress(
  applicationUuid: string
): Promise<CoolifyDeploymentProgressResult> {
  const coolifyBaseUrl = getCoolifyUrl();
  const listResult = await getCoolifyDeployments(applicationUuid, 1);
  if (!listResult.success) return listResult;
  const latest = listResult.deployments[0];
  if (!latest?.uuid) {
    const step = getDeploymentStepFromStatusAndLogs("pending", null);
    return {
      success: true,
      status: "pending",
      deploymentUrl: null,
      logs: null,
      deploymentUuid: null,
      coolifyBaseUrl: coolifyBaseUrl ?? null,
      deploymentStepIndex: 0,
      deploymentStepLabel: step.stepLabel,
    };
  }
  const detailResult = await getDeploymentByUuid(latest.uuid);
  if (!detailResult.success) return detailResult;
  const d = detailResult.deployment;
  const step = getDeploymentStepFromStatusAndLogs(d.status, d.logs ?? null);
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
    deploymentStepIndex: step.stepIndex,
    deploymentStepLabel: step.stepLabel,
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
    docker_cleanup: true,
    delete_connected_networks: true,
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

export type SyncComposeStackResult =
  | { success: true; template_key: string }
  | { success: false; error: string };

/**
 * Sync Docker Compose content from the repo into Supabase for a template (e.g. agent-stack).
 * Reads docker-compose.yml from the template's source_path and upserts compose_stacks.
 * Platform admin only. Call periodically or from Admin UI to pull updated versions from the repo.
 */
export async function syncComposeStack(templateKey: string): Promise<SyncComposeStackResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: isAdmin } = await supabase.rpc("is_platform_admin", { p_user_id: user.id });
  if (!isAdmin) return { success: false, error: "Platform admin only." };

  return syncComposeStackFromSource(templateKey);
}

export type DeleteProjectResult =
  | { success: true; warning?: string }
  | { success: false; error: string };

/**
 * Full teardown: remove Coolify app (best-effort), delete GitHub repo (best-effort), then always
 * delete the project row so the slug is freed for reuse. Coolify/GitHub failures are reported as
 * warnings; the project is always removed from our DB so "deleted" always means the slug is available.
 */
export async function deleteProject(projectId: string): Promise<DeleteProjectResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: project, error: fetchError } = await supabase
    .from("projects")
    .select("id, name, slug, tenant_id, template_id, coolify_application_uuid, github_repo_url")
    .eq("id", projectId)
    .single();

  if (fetchError || !project) return { success: false, error: fetchError?.message ?? "Project not found." };

  const { error: auditError } = await supabase.from("app_factory_audit_log").insert({
    action: "project_deleted",
    project_id: projectId,
    actor_id: user.id,
    metadata: {
      name: project.name,
      slug: project.slug,
      tenant_id: project.tenant_id,
      template_id: project.template_id,
      github_repo_url: project.github_repo_url ?? null,
      coolify_application_uuid: project.coolify_application_uuid ?? null,
    },
  });
  if (auditError) {
    console.warn("App Factory audit log (project_deleted) failed:", auditError.message);
  }

  const warnings: string[] = [];

  const appUuid = project.coolify_application_uuid as string | null;
  if (appUuid?.trim()) {
    const { deleteCoolifyApplication } = await import("./coolify");
    const delCoolify = await deleteCoolifyApplication(appUuid, {
      delete_configurations: true,
      delete_volumes: true,
      docker_cleanup: true,
      delete_connected_networks: true,
    });
    if (!delCoolify.success) {
      warnings.push(`Coolify app could not be removed: ${delCoolify.error}. You may delete it manually in Coolify.`);
    }
  }

  const repoUrl = project.github_repo_url as string | null;
  if (repoUrl?.trim()) {
    const delRepo = await deleteGitHubRepo(repoUrl);
    if (!delRepo.success) {
      warnings.push(`GitHub repository could not be removed: ${delRepo.error}. You may delete it manually: ${repoUrl}`);
    }
  }

  const { error: deleteError } = await supabase.from("projects").delete().eq("id", projectId);
  if (deleteError) return { success: false, error: deleteError.message };
  revalidatePath("/dashboard/app-factory/projects");
  return warnings.length ? { success: true, warning: warnings.join(" ") } : { success: true };
}

export type AppFactoryProjectRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  coolify_application_uuid: string | null;
  created_at: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
  tenant_slug: string | null;
};

/** List projects for the current user (tenant-scoped via RLS). Includes tenant for grouping and surfacing services. */
export async function getAppFactoryProjects(): Promise<
  { success: true; projects: AppFactoryProjectRow[] } | { success: false; error: string }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  const { data: rows, error } = await supabase
    .from("projects")
    .select("id, name, slug, status, coolify_application_uuid, created_at, tenant_id, tenants(name, slug)")
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  const projects: AppFactoryProjectRow[] = (rows ?? []).map((r) => {
    const rawTenant = (r as { tenants?: { name?: string; slug?: string } | { name?: string; slug?: string }[] | null }).tenants;
    const tenant = Array.isArray(rawTenant) ? rawTenant[0] : rawTenant;
    return {
      id: r.id,
      name: r.name ?? "",
      slug: r.slug ?? "",
      status: r.status ?? "draft",
      coolify_application_uuid: r.coolify_application_uuid ?? null,
      created_at: r.created_at ?? null,
      tenant_id: r.tenant_id ?? null,
      tenant_name: tenant?.name ?? null,
      tenant_slug: tenant?.slug ?? null,
    };
  });
  return { success: true, projects };
}

export type CoolifyServiceItem = { uuid?: string; name?: string; status?: string };

export type GetCoolifyServicesForTenantResult =
  | { success: true; services: CoolifyServiceItem[] }
  | { success: false; error: string };

/**
 * List Coolify applications (services) deployed in a tenant's Coolify project.
 * Used to dynamically surface what is deployed in Coolify per org. Each org has one Coolify project;
 * a project can have many services (applications).
 */
export async function getCoolifyServicesForTenant(
  tenantId: string
): Promise<GetCoolifyServicesForTenantResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  // Restrict to tenants the user is a member of (RLS on tenant_members).
  const { data: member } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) return { success: false, error: "Access denied to this tenant." };

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("coolify_project_uuid")
    .eq("id", tenantId)
    .single();

  if (tenantError || !tenant) {
    return { success: false, error: tenantError?.message ?? "Tenant not found." };
  }

  const projectUuid = (tenant as { coolify_project_uuid?: string | null }).coolify_project_uuid;
  if (!projectUuid?.trim()) {
    return { success: true, services: [] };
  }

  const result = await listCoolifyApplicationsByProjectUuid(projectUuid.trim());
  if (!result.success) return result;
  const services: CoolifyServiceItem[] = result.applications.map((a) => ({
    uuid: a.uuid,
    name: a.name,
    status: a.status,
  }));
  return { success: true, services };
}
