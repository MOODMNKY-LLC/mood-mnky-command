import { createClient } from "@/lib/supabase/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export type AppInstance = {
  id: string;
  tenant_id: string | null;
  app_type: string;
  name: string | null;
  base_url: string | null;
  api_key_encrypted: string | null;
  settings: Record<string, unknown>;
};

/** Well-known ids for env-based default instances (platform default, not in DB). */
export const ENV_INSTANCE_IDS = {
  flowise: "env-flowise",
  n8n: "env-n8n",
  minio: "env-minio",
  nextcloud: "env-nextcloud",
  coolify: "env-coolify",
} as const;

export type AppType = "flowise" | "n8n" | "minio" | "nextcloud" | "coolify";

/** Read a single env var from supabase-mt/.env.local when process.env doesn't have it (e.g. dev script path differs). */
function getEnvFromFile(key: string): string | null {
  try {
    const cwd = process.cwd();
    const envPath = join(cwd, "..", ".env.local");
    if (!existsSync(envPath)) return null;
    const raw = readFileSync(envPath, "utf-8");
    const line = raw.split(/\r?\n/).find((l) => {
      const trimmed = l.trim();
      return trimmed.startsWith(`${key}=`) && !trimmed.startsWith("#");
    });
    if (!line) return null;
    const value = line.slice(line.indexOf("=") + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1).trim();
    if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).trim();
    return value || null;
  } catch {
    return null;
  }
}

function getFlowiseApiKey(): string | null {
  return (
    process.env.FLOWISE_API_KEY?.trim() ||
    process.env.FLOWISE_SECRETKEY?.trim() ||
    process.env.FLOWISE_APIKEY?.trim() ||
    getEnvFromFile("FLOWISE_API_KEY") ||
    getEnvFromFile("FLOWISE_SECRETKEY") ||
    getEnvFromFile("FLOWISE_APIKEY") ||
    null
  );
}

function getN8nApiKey(): string | null {
  return process.env.N8N_API_KEY?.trim() || getEnvFromFile("N8N_API_KEY") || null;
}

function getMinioEndpoint(): string | null {
  return (
    process.env.MINIO_ENDPOINT?.trim() ||
    process.env.S3_ENDPOINT_URL?.trim() ||
    getEnvFromFile("MINIO_ENDPOINT") ||
    getEnvFromFile("S3_ENDPOINT_URL") ||
    null
  );
}

function getMinioAccessKey(): string | null {
  return (
    process.env.MINIO_ROOT_USER?.trim() ||
    process.env.S3_STORAGE_ACCESS_KEY_ID?.trim() ||
    getEnvFromFile("MINIO_ROOT_USER") ||
    getEnvFromFile("S3_STORAGE_ACCESS_KEY_ID") ||
    null
  );
}

function getNextcloudUrl(): string | null {
  return (
    process.env.NEXTCLOUD_URL?.trim() ||
    getEnvFromFile("NEXTCLOUD_URL") ||
    null
  );
}

function getNextcloudAdminUser(): string | null {
  return (
    process.env.NEXTCLOUD_ADMIN_USER?.trim() ||
    getEnvFromFile("NEXTCLOUD_ADMIN_USER") ||
    null
  );
}

function getCoolifyUrl(): string | null {
  const url =
    process.env.COOLIFY_URL?.trim() ||
    getEnvFromFile("COOLIFY_URL")?.trim();
  if (url) return url;
  const host = process.env.COOLIFY_API_HOST?.trim() || getEnvFromFile("COOLIFY_API_HOST")?.trim();
  if (host) return host.startsWith("http") ? host : `https://${host}`;
  return null;
}

function getCoolifyApiKey(): string | null {
  return process.env.COOLIFY_API_KEY?.trim() || getEnvFromFile("COOLIFY_API_KEY") || null;
}

/**
 * Return the native default instance from env (FLOWISE_URL / N8N_URL / MINIO_ENDPOINT / NEXTCLOUD_URL and API keys).
 * Used when no tenant_app_instances row exists or when back office targets "platform default".
 * Returns null if the corresponding URL is not set.
 * Falls back to reading supabase-mt/.env.local when process.env lacks the key (e.g. if dev is run from repo root).
 */
export function getEnvDefaultInstance(
  appType: AppType
): AppInstance | null {
  const url =
    appType === "flowise"
      ? process.env.FLOWISE_URL?.trim() || getEnvFromFile("FLOWISE_URL")?.trim()
      : appType === "n8n"
        ? process.env.N8N_URL?.trim() || getEnvFromFile("N8N_URL")?.trim()
        : appType === "nextcloud"
          ? getNextcloudUrl()
          : appType === "coolify"
            ? getCoolifyUrl()
            : getMinioEndpoint();
  const apiKey =
    appType === "flowise"
      ? getFlowiseApiKey()
      : appType === "n8n"
        ? getN8nApiKey()
        : appType === "nextcloud"
          ? getNextcloudAdminUser()
          : appType === "coolify"
            ? getCoolifyApiKey()
            : getMinioAccessKey();
  if (!url) return null;
  const id =
    appType === "flowise"
      ? ENV_INSTANCE_IDS.flowise
      : appType === "n8n"
        ? ENV_INSTANCE_IDS.n8n
        : appType === "nextcloud"
          ? ENV_INSTANCE_IDS.nextcloud
          : appType === "coolify"
            ? ENV_INSTANCE_IDS.coolify
            : ENV_INSTANCE_IDS.minio;
  return {
    id,
    tenant_id: null,
    app_type: appType,
    name: "default",
    base_url: url,
    api_key_encrypted: apiKey ?? null,
    settings: {},
  };
}

/** True if this instance is the env-based default (not from DB). */
export function isEnvDefaultInstance(instance: AppInstance): boolean {
  return (
    instance.id === ENV_INSTANCE_IDS.flowise ||
    instance.id === ENV_INSTANCE_IDS.n8n ||
    instance.id === ENV_INSTANCE_IDS.minio ||
    instance.id === ENV_INSTANCE_IDS.nextcloud ||
    instance.id === ENV_INSTANCE_IDS.coolify
  );
}

/**
 * Resolve an app instance by id. Returns null if not found or RLS denies access.
 * Caller must then verify platform_admin or is_tenant_admin(instance.tenant_id).
 */
export async function getInstanceById(
  instanceId: string
): Promise<AppInstance | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenant_app_instances")
    .select("id, tenant_id, app_type, name, base_url, api_key_encrypted, settings")
    .eq("id", instanceId)
    .single();

  if (error || !data) return null;
  const baseUrl = data.base_url ?? null;
  const apiKey = data.api_key_encrypted ?? null;
  const appType = data.app_type as AppType;
  const useEnvDefault =
    (baseUrl === null || baseUrl === "") &&
    (appType === "flowise" || appType === "n8n" || appType === "minio" || appType === "nextcloud" || appType === "coolify");
  const envInstance = useEnvDefault ? getEnvDefaultInstance(appType) : null;
  return {
    id: data.id,
    tenant_id: data.tenant_id,
    app_type: data.app_type,
    name: data.name ?? null,
    base_url: envInstance?.base_url ?? baseUrl,
    api_key_encrypted: envInstance?.api_key_encrypted ?? apiKey,
    settings: (data.settings as Record<string, unknown>) ?? {},
  };
}

/**
 * Resolve an app instance by tenant + app_type + optional name.
 * Name defaults to 'default' if not provided.
 */
export async function getInstanceByTenantAndApp(
  tenantId: string,
  appType: string,
  name?: string | null
): Promise<AppInstance | null> {
  const supabase = await createClient();
  const instanceName = name ?? "default";
  let query = supabase
    .from("tenant_app_instances")
    .select("id, tenant_id, app_type, name, base_url, api_key_encrypted, settings")
    .eq("tenant_id", tenantId)
    .eq("app_type", appType);

  if (instanceName === "default") {
    query = query.or("name.eq.default,name.is.null");
  } else {
    query = query.eq("name", instanceName);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error || !data) return null;
  const baseUrl = data.base_url ?? null;
  const apiKey = data.api_key_encrypted ?? null;
  const rowAppType = data.app_type as AppType;
  const useEnvDefault =
    (baseUrl === null || baseUrl === "") &&
    (rowAppType === "flowise" || rowAppType === "n8n" || rowAppType === "minio" || rowAppType === "nextcloud" || rowAppType === "coolify");
  const envInstance = useEnvDefault ? getEnvDefaultInstance(rowAppType) : null;
  return {
    id: data.id,
    tenant_id: data.tenant_id,
    app_type: data.app_type,
    name: data.name ?? null,
    base_url: envInstance?.base_url ?? baseUrl,
    api_key_encrypted: envInstance?.api_key_encrypted ?? apiKey,
    settings: (data.settings as Record<string, unknown>) ?? {},
  };
}

/**
 * Resolve instance for a tenant: DB first, then env default. Use in dashboard and tenant page
 * so tenants "natively" get the env-configured instance when they have no row.
 */
export async function getInstanceForTenantOrEnv(
  tenantId: string,
  appType: AppType,
  name?: string | null
): Promise<AppInstance | null> {
  const fromDb = await getInstanceByTenantAndApp(tenantId, appType, name);
  if (fromDb) return fromDb;
  return getEnvDefaultInstance(appType);
}

/**
 * Check if the current user is platform admin (for back office).
 */
export async function isPlatformAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();
  return profile?.platform_role === "platform_admin";
}

/**
 * Check if the current user is tenant admin for the given tenant.
 */
export async function isTenantAdmin(tenantId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.rpc("is_tenant_admin", {
    p_tenant_id: tenantId,
    p_user_id: user.id,
  });
  return data === true;
}

/**
 * Ensure current user can access the given instance: either platform_admin or tenant admin for instance.tenant_id.
 * Env default (tenant_id === null) is only accessible to platform_admin.
 */
export async function canAccessInstance(instance: AppInstance): Promise<boolean> {
  const platformAdmin = await isPlatformAdmin();
  if (instance.tenant_id === null) return platformAdmin;
  const tenantAdmin = await isTenantAdmin(instance.tenant_id);
  return platformAdmin || tenantAdmin;
}
