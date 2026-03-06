# Tenant Lifecycle and Governance

This document defines the lifecycle and governance contract for **tenants** in the Multi-Tenant Supabase (MT) project. Tenants are first-class entities (brands/workspaces) with explicit states and transitions.

## States

| State | Description | Data access |
|-------|-------------|-------------|
| **active** | Normal operation; members can access tenant-scoped data. | Full read/write per RLS. |
| **suspended** | Temporarily disabled (e.g. billing, abuse). Members cannot access tenant data. | RLS should restrict to no access (or read-only for export). |
| **archived** | Tenant retired; data retained for retention/export. No member access. | No access; data retained until purge. |

Schema: `public.tenants.status` is `text check (status in ('active', 'suspended', 'archived'))`. Default is `active`.

## Transitions

| From | To | Who can trigger | Notes |
|------|-----|-----------------|--------|
| (none) | active | Platform (service role / admin) | Tenant creation; initial state. |
| active | suspended | Platform / tenant owner (if supported) | Disable access without deleting data. |
| suspended | active | Platform | Restore access. |
| active / suspended | archived | Platform | Retire tenant; stop access; start retention clock. |
| archived | (none) | — | No reactivation; data export then purge per retention. |

Application code must resolve tenant and check `status = 'active'` before allowing member access (e.g. in `getTenantFromSlug` or route guards). Policies that use `is_tenant_member` can be extended to also require `tenants.status = 'active'` if desired (e.g. via a join in the policy).

## Data handling

- **Retention:** Define retention per tenant or globally (e.g. 90 days after archive). Document in runbooks.
- **Export:** Before purge or on request, export tenant-scoped data (e.g. via service role, filtered by `tenant_id`). Use for compliance or migration.
- **Purge:** After retention and export, delete or anonymize tenant-scoped rows. Order: child tables first, then `tenant_members`, then `tenants`.

## Who can trigger transitions

- **Platform:** Operations using the MT service role (admin scripts, support runbooks). No RLS policy for authenticated users on `tenants` insert/update/delete; only service role.
- **Tenant owner:** Optional future: allow owner to “suspend” their own tenant (e.g. self-service pause). Requires RLS or RPC that checks `tenant_members.role = 'owner'` and updates `tenants.status` to `suspended`.

## Mapping to schema and RLS

- **tenants.status** — Single column; all policies that allow member access should consider only `active` tenants (either in app logic or in RLS via join to `tenants`).
- **tenant_members** — Unchanged by state; membership remains until tenant is purged or member is removed.
- **Tenant-scoped tables** — RLS uses `is_tenant_member(tenant_id, auth.uid())`. To enforce “active only,” add a policy condition that the tenant’s `status = 'active'` (e.g. subquery or helper function).

## Platform owner tenant

One tenant may be designated the **platform owner** (overseer) by setting `tenants.is_platform_owner = true`. For MOOD MNKY, this is the first tenant (MOOD MNKY LLC, slug `mood-mnky`). Members of the platform-owner tenant have **maximum permissions** and **no limitations** within the MT system: they may list all tenants and perform lifecycle transitions (e.g. suspend, archive) on other tenants. Overseer actions are **not** exposed via RLS; they are implemented in the app/API layer using the MT service role, with the caller’s membership in a platform-owner tenant verified via `public.is_platform_owner_member(auth.uid())` (or equivalent) before performing list/update operations. Only one tenant should have `is_platform_owner = true`. Caller identity is checked with `public.is_overseer(user_id)`: true if the user is a member of a platform-owner tenant in MT auth, or if the user ID is in `platform_owner_external_users` (provision script adds the owner when using `--platform-owner`).

### Overseer API (apps/web)

- **GET /api/mt/tenants** — List all tenants. Requires authenticated session (main Supabase) and `is_overseer(user_id)`.
- **PATCH /api/mt/tenants/[id]** — Update tenant status. Body: `{ "status": "active" | "suspended" | "archived" }`. Same auth and overseer check.

## References

- [Default Tenant Strategy](#default-tenant-strategy) (below)
- [MULTITENANT-SUPABASE-SCHEMA-CONTRACT.md](MULTITENANT-SUPABASE-SCHEMA-CONTRACT.md)
- [MULTITENANT-SCOPE-REGISTER.md](MULTITENANT-SCOPE-REGISTER.md)

---

## Default Tenant Strategy

The **default tenant** is the tenant used for backfill and for existing users when the MT project is first adopted. It is a **normal tenant**: same schema, same RLS, same lifecycle as any other tenant.

### Rules

1. **No special-case code.** RLS and app logic must not branch on “is this the default tenant.” Use `tenant_id` and membership only.
2. **Reserved slug.** Use a reserved slug (e.g. `default` or `mood-mnky`) and document it. All apps that need a “first” or “primary” tenant resolve it by slug (or by a documented UUID for scripts).
3. **Documented ID.** Store the default tenant’s UUID in a runbook or in the Scope Register so ops and rollbacks can use it (e.g. for backfill, export, or debugging).
4. **Backfill and migration.** When migrating existing data into the MT project, create the default tenant first, then backfill `tenant_id` with the default tenant’s ID. No RLS or app logic should treat this tenant differently.

### Where to find the default tenant ID

- After creating the MT project and running bootstrap migrations, insert the default tenant (e.g. via SQL or provisioning script) and record its `id` in:
  - **Multi-Tenant Scope Register** — “Default tenant” row with slug and UUID.
  - **Runbooks** — For migrations and rollbacks.

### Rollback

If multi-tenancy is reverted, use the documented default tenant ID to identify rows that belonged to the single “effective” tenant. Rollback steps are in [SUPABASE-MULTITENANT-READINESS-REPORT.md](SUPABASE-MULTITENANT-READINESS-REPORT.md) (drop policies, drop tenant_id columns, etc.).
