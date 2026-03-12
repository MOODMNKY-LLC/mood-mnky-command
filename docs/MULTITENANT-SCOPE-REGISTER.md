# Multi-Tenant Scope Register

This register records, per **table** and per **service-role call site** (or route group), whether it is **tenant-scoped** or **platform-only**, and which resolution rule applies. Update it when adding tenant-scoped tables or MT API routes.

**Rule:** Tenant-scoped operations must resolve `tenant_id` from URL slug or server-validated profile and pass it into every query. Never trust client-supplied `tenant_id`.

**Default tenant:** Slug: `mood-mnky`. UUID: `46149958-9165-420c-92c6-62efbc1a1526` (local; record production UUID after first provision there). See [MULTITENANT-ONBOARDING.md](MULTITENANT-ONBOARDING.md) for the full provisioning command and onboarding steps.

**Platform owner:** The default tenant (MOOD MNKY LLC, slug `mood-mnky`) is the single platform-owner tenant (`tenants.is_platform_owner = true`). Overseer operations (list tenants, update tenant status) are allowed when `is_overseer(user_id)` is true: either a member of that tenant in MT auth, or the user ID is in `platform_owner_external_users` (e.g. main Supabase auth). Provision with `--platform-owner` adds the owner ID to `platform_owner_external_users`. See [TENANT-LIFECYCLE-AND-GOVERNANCE.md](TENANT-LIFECYCLE-AND-GOVERNANCE.md).

## Tables (MT project)

| Table | Scope | Resolution rule | Last reviewed |
|-------|--------|------------------|---------------|
| tenants | Platform (membership determines visibility) | N/A | 2025-03-06 |
| tenant_members | Platform | N/A | 2025-03-06 |
| tenant_invites | Platform (tenant admins manage) | N/A | 2025-03-06 |
| tenant_brand_copy | Tenant-scoped | slug → tenant_id + requireTenantMember | 2025-03-06 |
| tenant_design_tokens | Tenant-scoped | slug → tenant_id + requireTenantMember (read); requireTenantAdmin (write) | 2025-03-06 |
| tenant_content | Tenant-scoped | slug → tenant_id + requireTenantMember (read); requireTenantAdmin (write) | 2025-03-06 |
| tenant_app_instances | Tenant-scoped | slug → tenant_id + requireTenantMember (read); requireTenantAdmin (write) | 2025-03-06 |
| platform_owner_external_users | Platform | Service role only; provision script inserts on --platform-owner | 2025-03-06 |

## Service-role / API usage (MT project)

When adding routes or server code that use `createMTAdminClient()` or `getMTSupabaseClient()`:

| Route / area | Scope | Resolution rule | Notes |
|--------------|--------|------------------|--------|
| Tenant resolution (getTenantFromSlug, requireTenantMember) | Platform | slug from path; userId from auth | @mnky/mt-supabase |
| Tenant provisioning (create tenant + default copy/tokens) | Platform | N/A (creates tenant) | scripts/provision-mt-tenant.ts; see docs/ENV-MULTITENANT-SUPABASE.md |
| Overseer API (list tenants, update tenant status) | Platform | Main Supabase session; is_overseer(user_id) in MT | GET/PATCH apps/web/app/api/mt/tenants; caller must be in platform_owner_external_users or MT platform-owner member |
| LABZ/Dojo tenant-scoped APIs (future) | Tenant-scoped | slug from path or validated active_tenant_id | Pass tenantId into all queries |
| Agent apps (MOOD/SAGE/CODE MNKY) MT usage | Tenant-scoped | slug or active_tenant_id | Per-route |
| Flowise/n8n per-tenant config | Tenant-scoped | slug → tenant_id; read tenant_app_instances for app_type flowise/n8n | Fall back to env if no row; see docs/MULTITENANT-APP-INSTANCES.md |

## Checklist for new tenant-scoped table

1. Add table with `tenant_id uuid not null references public.tenants(id) on delete cascade`.
2. Enable RLS; add policies using `is_tenant_member` / `is_tenant_admin`.
3. Add composite index `(tenant_id, ...)` for common filters.
4. Add row to **Tables (MT project)** above with scope and resolution rule.
5. Ensure every API route that touches the table resolves tenant (slug or validated profile) and passes `tenant_id` into queries.

## References

- [SUPABASE-MULTITENANT-READINESS-REPORT.md](SUPABASE-MULTITENANT-READINESS-REPORT.md) — existing project audit
- [MULTITENANT-SUPABASE-SCHEMA-CONTRACT.md](MULTITENANT-SUPABASE-SCHEMA-CONTRACT.md) — schema rules
- [ENV-MULTITENANT-SUPABASE.md](ENV-MULTITENANT-SUPABASE.md) — env and client usage
