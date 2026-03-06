# Multi-Tenant Supabase Schema Contract

This document defines the schema contract for the **dedicated multi-tenant Supabase project** (MT project). Migrations live in `supabase-mt/migrations/` and must be applied only to that project.

## Migration order

Migrations must be run in lexicographic order (timestamp prefix):

1. `20250306120000_mt_tenants_and_members.sql` — core `tenants`, `tenant_members`, RLS
2. `20250306120001_mt_helpers.sql` — `is_tenant_member`, `is_tenant_admin`
3. `20250306120002_mt_tenant_invites.sql` — optional `tenant_invites`
4. `20250306120003_mt_tenant_brand_copy.sql` — tenant_brand_copy
5. `20250306120004_mt_tenant_design_tokens.sql` — tenant_design_tokens
6. `20250306120005_mt_tenant_content.sql` — tenant_content
7. `20250306120006_mt_platform_owner.sql` — `tenants.is_platform_owner`, `is_platform_owner_tenant()`, `is_platform_owner_member()`
8. `20250306120007_mt_overseer_external.sql` — `platform_owner_external_users`, `is_overseer()` (allows main Supabase user IDs to act as overseers)
9. `20250306120008_mt_tenant_app_instances.sql` — `tenant_app_instances` (per-tenant Flowise, n8n, or other app base_url/settings)
10. Later: profiles (if stored in MT), more tenant-scoped tables as needed.

RLS does not grant cross-tenant visibility. Overseer behavior (list all tenants, manage other tenants’ lifecycle) is implemented in the app layer using the service role, guarded by `is_platform_owner_member(user_id)`.

## Rule: no tenant-scoped table without tenant_id + RLS

- Every table that holds data belonging to a tenant **must** have:
  - `tenant_id uuid not null references public.tenants(id) on delete cascade`
  - RLS enabled with policies that use `public.is_tenant_member(tenant_id, auth.uid())` (read) and/or `public.is_tenant_admin(tenant_id, auth.uid())` (write where appropriate).
- Composite indexes: for tenant-scoped tables, create an index starting with `tenant_id` (e.g. `(tenant_id, created_at)`, `(tenant_id, profile_id)`) for query performance.

## Core tables

| Table | Purpose | tenant_id | RLS |
|-------|---------|-----------|-----|
| `tenants` | Tenant (brand/workspace) row; optional `is_platform_owner` for overseer | — | Members can select own tenant(s) via membership |
| `tenant_members` | User ↔ tenant membership and role | — | Users select own rows; writes via service role |
| `tenant_invites` | Pending invites by email | — | Tenant admins manage; invitee read by token |

## Naming conventions

- **tenant_id**: column name on all tenant-scoped tables; type `uuid`, NOT NULL, FK to `public.tenants(id)`.
- **Indexes**: `idx_<table>_tenant_id` or composite `idx_<table>_tenant_id_<other>`.
- **Policies**: descriptive names, e.g. `tenant_brand_copy_select_member`, `tenant_brand_copy_insert_admin`.

## Platform-only vs tenant-scoped

- **Tenant-scoped**: table has `tenant_id` and RLS uses `is_tenant_member` / `is_tenant_admin`. All app routes that touch it must resolve tenant from slug or validated `active_tenant_id` and pass `tenant_id` into every query.
- **Platform-only**: no `tenant_id`; access via service role or fixed policies (e.g. sync_logs). Do not use for tenant-specific data.

When adding a new tenant-scoped table:

1. Add `tenant_id uuid not null references public.tenants(id) on delete cascade`.
2. Enable RLS and add policies using `is_tenant_member` / `is_tenant_admin`.
3. Add composite index `(tenant_id, ...)` for common filters.
4. Update the [Multi-Tenant Scope Register](MULTITENANT-SCOPE-REGISTER.md).

## References

- [SUPABASE-MULTITENANT-READINESS-REPORT.md](SUPABASE-MULTITENANT-READINESS-REPORT.md) — existing single-tenant project and migration path
- [ENV-MULTITENANT-SUPABASE.md](ENV-MULTITENANT-SUPABASE.md) — MT env vars and client usage
- [MULTITENANT-APP-INSTANCES.md](MULTITENANT-APP-INSTANCES.md) — per-tenant Flowise, n8n, and other app config (`tenant_app_instances`)
