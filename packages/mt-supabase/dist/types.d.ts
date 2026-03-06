/** Tenant row from public.tenants (MT project). */
export type Tenant = {
    id: string;
    slug: string;
    name: string;
    status: "active" | "suspended" | "archived";
    is_platform_owner?: boolean;
    settings: Record<string, unknown>;
    created_at: string;
    updated_at: string;
};
/** Tenant membership row from public.tenant_members (MT project). */
export type TenantMember = {
    user_id: string;
    tenant_id: string;
    role: "owner" | "admin" | "member" | "viewer";
    created_at: string;
    updated_at: string;
};
/** Resolved tenant context for use in tenant-scoped queries. */
export type TenantContext = {
    tenantId: string;
    tenant: Tenant;
    membership?: TenantMember;
};
//# sourceMappingURL=types.d.ts.map