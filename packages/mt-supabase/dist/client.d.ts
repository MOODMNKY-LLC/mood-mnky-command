import { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "./types.js";
/**
 * Creates a Supabase admin client for the MT project (service role; bypasses RLS).
 * Use server-side only for tenant resolution, membership checks, and tenant-scoped operations.
 * For tenant-scoped data, callers must pass resolved tenantId and filter all queries by tenant_id.
 */
export declare function createMTAdminClient(): SupabaseClient;
/**
 * Returns the MT admin client. For tenant-scoped operations, the caller must supply
 * a server-validated tenantId and use it in every query (e.g. .eq('tenant_id', tenantId)).
 * Never pass tenantId from client input without resolving via getTenantFromSlug or
 * server-fetched profile + requireTenantMember.
 */
export declare function getMTSupabaseClient(_context: {
    tenantId: string;
}): SupabaseClient;
/**
 * Returns tenant context for use in routes. Call this after resolving slug and membership
 * so that tenantId is guaranteed server-validated.
 */
export declare function getMTClientWithContext(context: TenantContext): SupabaseClient;
/** Use when you need to detect missing MT config without throwing (e.g. optional MT features). */
export declare function getMTConfigMissing(): string | null;
//# sourceMappingURL=client.d.ts.map