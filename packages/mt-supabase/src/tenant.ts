import { createMTAdminClient, getMTConfigMissing } from "./client.js";
import type { Tenant, TenantMember } from "./types.js";

/** Default tenant slug for MOOD MNKY LLC (platform owner). Override via NEXT_PUBLIC_MT_DEFAULT_TENANT_SLUG. */
export const DEFAULT_TENANT_SLUG = "mood-mnky";

/** Returns the default tenant slug (for agent apps and scripts). */
export function getDefaultTenantSlug(): string {
  return process.env.NEXT_PUBLIC_MT_DEFAULT_TENANT_SLUG ?? DEFAULT_TENANT_SLUG;
}

/**
 * Resolves a tenant by slug. Use for routes like /t/[slug] where slug is the source of truth.
 * Returns null if not found or status is not active (caller may still allow for admin views).
 */
export async function getTenantFromSlug(slug: string): Promise<Tenant | null> {
  const supabase = createMTAdminClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to resolve tenant by slug: ${error.message}`);
  }
  return data as Tenant | null;
}

/**
 * Ensures the user is a member of the tenant; returns the membership row.
 * Throws if not a member or tenant not found. Use after getTenantFromSlug for route guard.
 */
export async function requireTenantMember(
  tenantId: string,
  userId: string
): Promise<TenantMember> {
  const supabase = createMTAdminClient();
  const { data, error } = await supabase
    .from("tenant_members")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to check tenant membership: ${error.message}`);
  }
  if (!data) {
    throw new Error("User is not a member of this tenant");
  }
  return data as TenantMember;
}

/**
 * Ensures the user is an owner or admin of the tenant; returns the membership row.
 * Throws if not admin/owner or tenant not found. Use for write operations (e.g. edit brand copy).
 */
export async function requireTenantAdmin(
  tenantId: string,
  userId: string
): Promise<TenantMember> {
  const member = await requireTenantMember(tenantId, userId);
  if (member.role !== "owner" && member.role !== "admin") {
    throw new Error("User does not have admin access to this tenant");
  }
  return member;
}

/**
 * Resolves tenant by slug and validates membership for the given user.
 * Returns tenant and membership; throws if slug invalid or user not a member.
 */
export async function getTenantAndMembership(
  slug: string,
  userId: string
): Promise<{ tenant: Tenant; membership: TenantMember }> {
  const tenant = await getTenantFromSlug(slug);
  if (!tenant) {
    throw new Error("Tenant not found");
  }
  if (tenant.status !== "active") {
    throw new Error("Tenant is not active");
  }
  const membership = await requireTenantMember(tenant.id, userId);
  return { tenant, membership };
}

/** Brand copy row from tenant_brand_copy. */
export type TenantBrandCopyRow = { scope: string; key: string; content: string };

/**
 * Fetches brand copy for the default tenant (server-side only). Returns null if MT config is missing.
 * Use for agent app hero headlines, taglines, etc. without requiring user auth.
 */
export async function getDefaultTenantBrandCopy(scope: string, key: string): Promise<string | null> {
  if (getMTConfigMissing()) return null;
  const supabase = createMTAdminClient();
  const slug = getDefaultTenantSlug();
  const { data: tenant } = await supabase.from("tenants").select("id").eq("slug", slug).maybeSingle();
  if (!tenant) return null;
  const { data: row } = await supabase
    .from("tenant_brand_copy")
    .select("content")
    .eq("tenant_id", tenant.id)
    .eq("scope", scope)
    .eq("key", key)
    .maybeSingle();
  return row?.content ?? null;
}

/**
 * Fetches multiple brand copy entries for the default tenant by scope. Returns a map key -> content.
 */
export async function getDefaultTenantBrandCopyByScope(
  scope: string
): Promise<Record<string, string>> {
  if (getMTConfigMissing()) return {};
  const supabase = createMTAdminClient();
  const slug = getDefaultTenantSlug();
  const { data: tenant } = await supabase.from("tenants").select("id").eq("slug", slug).maybeSingle();
  if (!tenant) return {};
  const { data: rows } = await supabase
    .from("tenant_brand_copy")
    .select("key, content")
    .eq("tenant_id", tenant.id)
    .eq("scope", scope);
  const out: Record<string, string> = {};
  for (const r of rows ?? []) out[r.key] = r.content ?? "";
  return out;
}

/** Row from tenant_app_instances (per-tenant Flowise, n8n, etc.). */
export type TenantAppInstanceRow = {
  id: string;
  tenant_id: string;
  app_type: string;
  base_url: string | null;
  api_key_encrypted: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

/**
 * Fetches app instance config for a tenant and app type (e.g. flowise, n8n).
 * Returns null if MT config is missing, tenant has no row, or row not found.
 * Caller should fall back to env (FLOWISE_HOST, N8N_BASE_URL, etc.) when null.
 */
export async function getTenantAppInstance(
  tenantId: string,
  appType: string
): Promise<TenantAppInstanceRow | null> {
  if (getMTConfigMissing()) return null;
  const supabase = createMTAdminClient();
  const { data, error } = await supabase
    .from("tenant_app_instances")
    .select("id, tenant_id, app_type, base_url, api_key_encrypted, settings, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .eq("app_type", appType)
    .maybeSingle();
  if (error) return null;
  return data as TenantAppInstanceRow | null;
}
