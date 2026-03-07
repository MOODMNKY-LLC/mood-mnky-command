/**
 * App Factory: create Coolify application from public Git repo and trigger deploy.
 * Uses COOLIFY_URL and COOLIFY_API_KEY from env (see env.ts).
 */

import { getAppFactoryCoolifyProjectName, getCoolifyApiKey, getCoolifyUrl } from "./env";

export type CoolifyDeployInput = {
  repoUrl: string;
  branch?: string;
  appName: string;
  /** From deployment spec; if not set, first server and first project are used */
  coolify_project_uuid?: string | null;
  coolify_server_uuid?: string | null;
  coolify_environment_uuid?: string | null;
  /** Domain for proxy routing (recommended with one public IP). */
  domain?: string | null;
  /** Host port to map to container 3000 (e.g. 3001). Use when not using domains; assign unique port per app. */
  coolify_host_port?: number | null;
  /** When "platforms", send pnpm install/build/start so Nixpacks does not run empty bash -c. When "compose", repo contains docker-compose.yml. */
  usedTemplate?: "platforms" | "stub" | "compose" | null;
};

export type CoolifyDeployResult =
  | { success: true; applicationUuid: string; message?: string }
  | { success: false; error: string };

/**
 * True if the value is a valid hostname (FQDN) for Coolify domains.
 * Coolify rejects values like "test" (no TLD); we require at least one dot and valid hostname chars.
 */
export function isValidCoolifyDomain(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  const s = value.trim().toLowerCase();
  if (!s) return false;
  if (!s.includes(".")) return false;
  try {
    new URL(`http://${s}`);
    return true;
  } catch {
    return false;
  }
}

async function coolifyFetch(path: string, init?: RequestInit): Promise<Response> {
  const baseUrl = getCoolifyUrl();
  const token = getCoolifyApiKey();
  if (!baseUrl || !token) {
    throw new Error("COOLIFY_URL and COOLIFY_API_KEY must be set.");
  }
  const url = `${baseUrl.replace(/\/$/, "")}/api/v1${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

/**
 * Create application from public Git repo and optionally trigger instant deploy.
 */
export async function createCoolifyApplicationAndDeploy(
  input: CoolifyDeployInput
): Promise<CoolifyDeployResult> {
  const { repoUrl, branch = "main", appName, coolify_project_uuid, coolify_server_uuid, coolify_environment_uuid } = input;

  let projectUuid = coolify_project_uuid ?? null;
  let serverUuid = coolify_server_uuid ?? null;

  if (!projectUuid || !serverUuid) {
    const [serversRes, projectsRes] = await Promise.all([
      coolifyFetch("/servers"),
      coolifyFetch("/projects"),
    ]);
    if (!serversRes.ok) {
      return { success: false, error: `Coolify servers: ${serversRes.status} ${await serversRes.text()}` };
    }
    if (!projectsRes.ok) {
      return { success: false, error: `Coolify projects: ${projectsRes.status} ${await projectsRes.text()}` };
    }
    const servers = (await serversRes.json()) as { uuid?: string }[];
    const projects = (await projectsRes.json()) as { uuid?: string; name?: string }[];
    if (!serverUuid && servers.length > 0) serverUuid = servers[0].uuid ?? null;
    if (!projectUuid && projects.length > 0) {
      const preferredName = getAppFactoryCoolifyProjectName();
      const byName = preferredName
        ? projects.find((p) => (p.name ?? "").trim().toLowerCase() === preferredName.trim().toLowerCase())
        : null;
      projectUuid = (byName?.uuid ?? projects[0].uuid) ?? null;
    }
  }

  if (!projectUuid || !serverUuid) {
    return { success: false, error: "No Coolify server or project found. Configure coolify_server_uuid and coolify_project_uuid in the deployment spec or add a server/project in Coolify." };
  }

  const isCompose = input.usedTemplate === "compose";
  const hasValidDomain = isValidCoolifyDomain(input.domain);
  /** Per Coolify UI: domain can be specified with scheme (e.g. https://app.coolify.io). Use https:// so proxy routes correctly. */
  const domainsValue = hasValidDomain
    ? (input.domain!.trim().startsWith("http") ? input.domain!.trim() : `https://${input.domain!.trim()}`)
    : undefined;

  const needsExplicitCommands = input.usedTemplate === "platforms" || input.usedTemplate === "stub";
  const installCmd = input.usedTemplate === "platforms" ? "pnpm install" : input.usedTemplate === "stub" ? "npm install" : undefined;
  const buildCmd = input.usedTemplate === "platforms" ? "pnpm build" : input.usedTemplate === "stub" ? "npm run build" : undefined;
  const startCmd = input.usedTemplate === "platforms" ? "pnpm start" : input.usedTemplate === "stub" ? "npm run start" : undefined;

  const body: Record<string, unknown> = {
    project_uuid: projectUuid,
    server_uuid: serverUuid,
    git_repository: repoUrl,
    git_branch: branch,
    name: appName,
    build_pack: isCompose ? "dockercompose" : "nixpacks",
    /** Defer deploy until after PATCH so Nixpacks uses our start_command (avoids /bin/bash -c empty argument restart loop). */
    instant_deploy: !needsExplicitCommands,
    ...(isCompose ? {} : { ports_exposes: "3000" }),
  };
  if (installCmd) body.install_command = installCmd;
  if (buildCmd) body.build_command = buildCmd;
  if (startCmd) body.start_command = startCmd;
  if (coolify_environment_uuid) {
    body.environment_uuid = coolify_environment_uuid;
  } else {
    body.environment_name = "production";
  }
  if (domainsValue) {
    body.domains = domainsValue;
    body.autogenerate_domain = false;
    /** Force our domain over any server-level wildcard/autogenerated domain (see APP-FACTORY-COOLIFY-DOMAINS.md). */
    body.force_domain_override = true;
  }
  if (input.coolify_host_port != null && !hasValidDomain) {
    body.ports_mappings = `${input.coolify_host_port}:3000`;
  }

  const res = await coolifyFetch("/applications/public", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = (text ? JSON.parse(text) : {}) as Record<string, unknown>;
  } catch {
    // leave data empty
  }

  if (!res.ok) {
    const errorMessage = formatCoolifyError(res.status, data, text);
    return { success: false, error: errorMessage };
  }

  const applicationUuid = data.uuid as string | undefined;
  if (!applicationUuid) {
    return { success: false, error: "Coolify did not return application uuid." };
  }

  // Always PATCH domains when we have a custom domain: Coolify may ignore domains on POST and fall back to
  // UUID-based subdomain (see APP-FACTORY-COOLIFY-DOMAINS.md). PATCH ensures our domain is set.
  if (domainsValue) {
    const domainPatch: Record<string, unknown> = { domains: domainsValue };
    if (needsExplicitCommands) {
      (domainPatch as Record<string, unknown>).install_command = installCmd ?? "";
      (domainPatch as Record<string, unknown>).build_command = buildCmd ?? "";
      (domainPatch as Record<string, unknown>).start_command = startCmd ?? "";
    }
    const patchRes = await coolifyFetch(`/applications/${encodeURIComponent(applicationUuid)}`, {
      method: "PATCH",
      body: JSON.stringify(domainPatch),
    });
    if (!patchRes.ok) {
      const patchText = await patchRes.text();
      console.warn("Coolify PATCH application (domains/commands) failed:", patchRes.status, patchText);
    }
  } else if (needsExplicitCommands) {
    const patchPayload: Record<string, unknown> = {
      install_command: installCmd ?? "",
      build_command: buildCmd ?? "",
      start_command: startCmd ?? "",
    };
    const patchRes = await coolifyFetch(`/applications/${encodeURIComponent(applicationUuid)}`, {
      method: "PATCH",
      body: JSON.stringify(patchPayload),
    });
    if (!patchRes.ok) {
      const patchText = await patchRes.text();
      console.warn("Coolify PATCH application (commands) failed:", patchRes.status, patchText);
    }
  }

  if (needsExplicitCommands) {
    const deployRes = await coolifyFetch(`/deploy?uuid=${encodeURIComponent(applicationUuid)}`, { method: "GET" });
    if (!deployRes.ok) {
      return { success: false, error: `Coolify deploy trigger: ${deployRes.status} ${await deployRes.text()}` };
    }
  }

  return { success: true, applicationUuid, message: "Application created and deploy triggered." };
}

export type SetCoolifyApplicationEnvResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Set environment variables on a Coolify application (POST /applications/{uuid}/envs per key).
 * Use after creating the app so the next build/deploy has e.g. NEXT_PUBLIC_ROOT_DOMAIN.
 */
export async function setCoolifyApplicationEnv(
  applicationUuid: string,
  envVars: Record<string, string>
): Promise<SetCoolifyApplicationEnvResult> {
  for (const [key, value] of Object.entries(envVars)) {
    if (key === "" || value === undefined) continue;
    const res = await coolifyFetch(`/applications/${encodeURIComponent(applicationUuid)}/envs`, {
      method: "POST",
      body: JSON.stringify({ key, value }),
    });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = (text ? JSON.parse(text) : {}) as Record<string, unknown>;
    } catch {
      // leave empty
    }
    if (!res.ok) {
      const err = formatCoolifyError(res.status, data, text);
      return { success: false, error: `Coolify env ${key}: ${err}` };
    }
  }
  return { success: true };
}

/** Coolify application detail (status, fqdn, etc.) from GET /applications/{uuid} */
export type CoolifyAppDetail = {
  uuid: string;
  name?: string;
  status?: string;
  fqdn?: string;
  git_repository?: string;
  git_branch?: string;
};

/**
 * Fetch application by UUID. Returns status, fqdn, and basic info for display.
 */
export async function getCoolifyApplication(
  applicationUuid: string
): Promise<{ success: true; app: CoolifyAppDetail } | { success: false; error: string }> {
  const res = await coolifyFetch(`/applications/${encodeURIComponent(applicationUuid)}`);
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = (text ? JSON.parse(text) : {}) as Record<string, unknown>;
  } catch {
    // leave empty
  }
  if (!res.ok) {
    const err = formatCoolifyError(res.status, data, text);
    return { success: false, error: err };
  }
  const app: CoolifyAppDetail = {
    uuid: (data.uuid as string) ?? applicationUuid,
    name: data.name as string | undefined,
    status: data.status as string | undefined,
    fqdn: data.fqdn as string | undefined,
    git_repository: data.git_repository as string | undefined,
    git_branch: data.git_branch as string | undefined,
  };
  return { success: true, app };
}

/**
 * List deployments for an application (latest first). Used to show deployment status.
 */
export async function getCoolifyDeployments(
  applicationUuid: string,
  take = 5
): Promise<{ success: true; deployments: { uuid?: string; status?: string; created_at?: string }[] } | { success: false; error: string }> {
  const res = await coolifyFetch(
    `/deployments/applications/${encodeURIComponent(applicationUuid)}?take=${Math.max(1, take)}`
  );
  const text = await res.text();
  let data: unknown = [];
  try {
    data = text ? JSON.parse(text) : [];
  } catch {
    data = [];
  }
  if (!res.ok) {
    const err = typeof data === "object" && data !== null && "message" in (data as Record<string, unknown>)
      ? String((data as Record<string, unknown>).message)
      : text || `Coolify ${res.status}`;
    return { success: false, error: err };
  }
  const list = Array.isArray(data) ? data : [];
  const deployments = list.map((d: Record<string, unknown>) => ({
    uuid: (d.uuid ?? d.deployment_uuid) as string | undefined,
    status: d.status as string | undefined,
    created_at: d.created_at as string | undefined,
  }));
  return { success: true, deployments };
}

/** Single deployment detail from GET /deployments/{uuid} (status, logs, deployment_url). */
export type CoolifyDeploymentDetail = {
  deployment_uuid: string;
  status: string;
  logs: string | null;
  deployment_url: string | null;
  application_name?: string;
  application_id?: string;
  commit?: string;
  commit_message?: string;
  created_at?: string;
  updated_at?: string;
};

/**
 * Get deployment by UUID. Returns status, logs, deployment_url for progress and final result.
 * See: https://coolify.io/docs/api-reference/api/operations/get-deployment-by-uuid
 */
export async function getDeploymentByUuid(
  deploymentUuid: string
): Promise<{ success: true; deployment: CoolifyDeploymentDetail } | { success: false; error: string }> {
  const res = await coolifyFetch(`/deployments/${encodeURIComponent(deploymentUuid)}`);
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = (text ? JSON.parse(text) : {}) as Record<string, unknown>;
  } catch {
    // leave empty
  }
  if (!res.ok) {
    const err = formatCoolifyError(res.status, data, text);
    return { success: false, error: err };
  }
  const deployment: CoolifyDeploymentDetail = {
    deployment_uuid: (data.deployment_uuid ?? data.uuid ?? deploymentUuid) as string,
    status: (data.status as string) ?? "",
    logs: (data.logs as string) ?? null,
    deployment_url: (data.deployment_url as string) ?? null,
    application_name: data.application_name as string | undefined,
    application_id: data.application_id as string | undefined,
    commit: data.commit as string | undefined,
    commit_message: data.commit_message as string | undefined,
    created_at: data.created_at as string | undefined,
    updated_at: data.updated_at as string | undefined,
  };
  return { success: true, deployment };
}

/** Coolify deployment terminal statuses (success and failure). Coolify may use "finished" for successful builds. */
const TERMINAL_DEPLOYMENT_STATUSES = ["success", "succeeded", "finished", "failed", "cancelled", "error"];

function isTerminalStatus(status: string): boolean {
  const s = status?.toLowerCase().trim() ?? "";
  return TERMINAL_DEPLOYMENT_STATUSES.some((t) => s === t);
}

/**
 * Wait for the latest deployment of an application to reach a terminal status (success/failed).
 * Polls list deployments then GET /deployments/{uuid} until status is terminal or timeout.
 * Returns the final deployment detail (status, deployment_url, logs) for confirmation and display.
 */
export async function waitForDeploymentCompletion(
  applicationUuid: string,
  options?: {
    timeoutMs?: number;
    pollIntervalMs?: number;
    maxWaitForDeploymentStartMs?: number;
  }
): Promise<
  | { success: true; deployment: CoolifyDeploymentDetail }
  | { success: false; error: string; deployment?: CoolifyDeploymentDetail }
> {
  const timeoutMs = options?.timeoutMs ?? 25 * 60 * 1000; // 25 min (Next.js install+build can be slow)
  const pollIntervalMs = options?.pollIntervalMs ?? 5000; // 5 s
  const maxWaitForDeploymentStartMs = options?.maxWaitForDeploymentStartMs ?? 120 * 1000; // 2 min for first deployment to appear

  const startedAt = Date.now();

  let deploymentUuid: string | null = null;
  while (Date.now() - startedAt < maxWaitForDeploymentStartMs) {
    const listResult = await getCoolifyDeployments(applicationUuid, 1);
    if (!listResult.success) return listResult;
    const latest = listResult.deployments[0];
    if (latest?.uuid) {
      deploymentUuid = latest.uuid;
      break;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (!deploymentUuid) {
    return {
      success: false,
      error: "Coolify did not start a deployment in time. Check the application in Coolify.",
    };
  }

  while (Date.now() - startedAt < timeoutMs) {
    const detailResult = await getDeploymentByUuid(deploymentUuid);
    if (!detailResult.success) return detailResult;
    const d = detailResult.deployment;
    if (isTerminalStatus(d.status)) {
      return { success: true, deployment: d };
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }

  const lastResult = await getDeploymentByUuid(deploymentUuid);
  const last = lastResult.success ? lastResult.deployment : undefined;
  return {
    success: false,
    error: `Deployment did not complete within ${timeoutMs / 1000}s. Last status: ${last?.status ?? "unknown"}.`,
    deployment: last,
  };
}

/**
 * Update application config (PATCH /applications/{uuid}). Use to fix empty start_command (restart loop).
 * Then call triggerCoolifyDeploy to redeploy with the new config.
 */
export async function updateCoolifyApplication(
  applicationUuid: string,
  updates: {
    install_command?: string;
    build_command?: string;
    start_command?: string;
    domains?: string;
  }
): Promise<{ success: true } | { success: false; error: string }> {
  const body: Record<string, unknown> = {};
  if (updates.install_command !== undefined) body.install_command = updates.install_command;
  if (updates.build_command !== undefined) body.build_command = updates.build_command;
  if (updates.start_command !== undefined) body.start_command = updates.start_command;
  if (updates.domains !== undefined) body.domains = updates.domains.startsWith("http") ? updates.domains : `https://${updates.domains}`;
  if (Object.keys(body).length === 0) return { success: true };
  const res = await coolifyFetch(`/applications/${encodeURIComponent(applicationUuid)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = (text ? JSON.parse(text) : {}) as Record<string, unknown>;
  } catch {
    // leave empty
  }
  if (!res.ok) {
    return { success: false, error: formatCoolifyError(res.status, data, text) };
  }
  return { success: true };
}

/**
 * Trigger a new deployment for an application (GET /deploy?uuid=). Use after updateCoolifyApplication to apply new start_command.
 */
export async function triggerCoolifyDeploy(applicationUuid: string): Promise<{ success: true } | { success: false; error: string }> {
  const res = await coolifyFetch(`/deploy?uuid=${encodeURIComponent(applicationUuid)}`, { method: "GET" });
  if (!res.ok) {
    const text = await res.text();
    return { success: false, error: `Coolify deploy trigger: ${res.status} ${text}` };
  }
  return { success: true };
}

/**
 * Delete application in Coolify by UUID. Removes app and optionally configs/volumes.
 */
export async function deleteCoolifyApplication(
  applicationUuid: string,
  options?: { delete_configurations?: boolean; delete_volumes?: boolean }
): Promise<{ success: true } | { success: false; error: string }> {
  const params = new URLSearchParams();
  if (options?.delete_configurations !== undefined) params.set("delete_configurations", String(options.delete_configurations));
  if (options?.delete_volumes !== undefined) params.set("delete_volumes", String(options.delete_volumes));
  const qs = params.toString();
  const path = `/applications/${encodeURIComponent(applicationUuid)}${qs ? `?${qs}` : ""}`;
  const res = await coolifyFetch(path, { method: "DELETE" });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = (text ? JSON.parse(text) : {}) as Record<string, unknown>;
  } catch {
    // leave empty
  }
  if (!res.ok) {
    const err = formatCoolifyError(res.status, data, text);
    return { success: false, error: err };
  }
  return { success: true };
}

/**
 * Build a readable error string from Coolify API error response.
 * Handles common shapes: message, errors (object or array), validation-style payloads.
 */
function formatCoolifyError(status: number, data: Record<string, unknown>, fallbackText: string): string {
  const parts: string[] = [];

  const message = data.message as string | undefined;
  if (message) parts.push(message);

  const errors = data.errors;
  if (errors != null && typeof errors === "object") {
    if (Array.isArray(errors)) {
      const msgs = errors
        .map((e) => (typeof e === "string" ? e : (e as { message?: string }).message ?? JSON.stringify(e)))
        .filter(Boolean);
      if (msgs.length) parts.push(msgs.join("; "));
    } else {
      const entries = Object.entries(errors as Record<string, unknown>);
      const detail = entries
        .map(([k, v]) => {
          const val = Array.isArray(v) ? v.join(", ") : String(v);
          return `${k}: ${val}`;
        })
        .join("; ");
      if (detail) parts.push(detail);
    }
  }

  // Some APIs return error or validation_errors at top level
  const err = data.error as string | undefined;
  if (err && !parts.some((p) => p.includes(err))) parts.push(err);
  const validation = data.validation_errors as string | Record<string, unknown> | undefined;
  if (validation) {
    const valStr = typeof validation === "string" ? validation : JSON.stringify(validation);
    if (valStr && valStr !== "{}") parts.push(valStr);
  }

  const out = parts.length ? parts.join(" — ") : fallbackText?.trim() || `Coolify API ${status}`;
  return status >= 400 ? `[${status}] ${out}` : out;
}
