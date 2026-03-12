import type { Tenant, TenantMember } from "./types.js";
/** Default tenant slug for MOOD MNKY LLC (platform owner). Override via NEXT_PUBLIC_MT_DEFAULT_TENANT_SLUG. */
export declare const DEFAULT_TENANT_SLUG = "mood-mnky";
/** Returns the default tenant slug (for agent apps and scripts). */
export declare function getDefaultTenantSlug(): string;
/**
 * Resolves a tenant by slug. Use for routes like /t/[slug] where slug is the source of truth.
 * Returns null if not found or status is not active (caller may still allow for admin views).
 */
export declare function getTenantFromSlug(slug: string): Promise<Tenant | null>;
/**
 * Ensures the user is a member of the tenant; returns the membership row.
 * Throws if not a member or tenant not found. Use after getTenantFromSlug for route guard.
 */
export declare function requireTenantMember(tenantId: string, userId: string): Promise<TenantMember>;
/**
 * Ensures the user is an owner or admin of the tenant; returns the membership row.
 * Throws if not admin/owner or tenant not found. Use for write operations (e.g. edit brand copy).
 */
export declare function requireTenantAdmin(tenantId: string, userId: string): Promise<TenantMember>;
/**
 * Resolves tenant by slug and validates membership for the given user.
 * Returns tenant and membership; throws if slug invalid or user not a member.
 */
export declare function getTenantAndMembership(slug: string, userId: string): Promise<{
    tenant: Tenant;
    membership: TenantMember;
}>;
/** Brand copy row from tenant_brand_copy. */
export type TenantBrandCopyRow = {
    scope: string;
    key: string;
    content: string;
};
/**
 * Fetches brand copy for the default tenant (server-side only). Returns null if MT config is missing.
 * Use for agent app hero headlines, taglines, etc. without requiring user auth.
 */
export declare function getDefaultTenantBrandCopy(scope: string, key: string): Promise<string | null>;
/**
 * Fetches multiple brand copy entries for the default tenant by scope. Returns a map key -> content.
 */
export declare function getDefaultTenantBrandCopyByScope(scope: string): Promise<Record<string, string>>;
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
export declare function getTenantAppInstance(tenantId: string, appType: string): Promise<TenantAppInstanceRow | null>;
//# sourceMappingURL=tenant.d.ts.map