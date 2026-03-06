import { createClient } from "@supabase/supabase-js";
const MT_CONFIG_ERROR = "Missing Multi-Tenant Supabase config. Set NEXT_PUBLIC_SUPABASE_MT_URL and SUPABASE_MT_SERVICE_ROLE_KEY. See docs/ENV-MULTITENANT-SUPABASE.md.";
/**
 * Creates a Supabase admin client for the MT project (service role; bypasses RLS).
 * Use server-side only for tenant resolution, membership checks, and tenant-scoped operations.
 * For tenant-scoped data, callers must pass resolved tenantId and filter all queries by tenant_id.
 */
export function createMTAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_MT_URL;
    const key = process.env.SUPABASE_MT_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error(MT_CONFIG_ERROR);
    }
    return createClient(url, key);
}
/**
 * Returns the MT admin client. For tenant-scoped operations, the caller must supply
 * a server-validated tenantId and use it in every query (e.g. .eq('tenant_id', tenantId)).
 * Never pass tenantId from client input without resolving via getTenantFromSlug or
 * server-fetched profile + requireTenantMember.
 */
export function getMTSupabaseClient(_context) {
    return createMTAdminClient();
}
/**
 * Returns tenant context for use in routes. Call this after resolving slug and membership
 * so that tenantId is guaranteed server-validated.
 */
export function getMTClientWithContext(context) {
    return getMTSupabaseClient({ tenantId: context.tenantId });
}
/** Use when you need to detect missing MT config without throwing (e.g. optional MT features). */
export function getMTConfigMissing() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_MT_URL;
    const key = process.env.SUPABASE_MT_SERVICE_ROLE_KEY;
    if (url && key)
        return null;
    return !url ? "NEXT_PUBLIC_SUPABASE_MT_URL" : "SUPABASE_MT_SERVICE_ROLE_KEY";
}
