# Multi-Tenant Supabase — Environment Variables and Usage

This document describes environment variables and usage for the **dedicated multi-tenant Supabase project** (MT project). The MT project is separate from the existing single-tenant Supabase used by `apps/web` and `apps/hydaelyn`.

**Structured onboarding:** For a step-by-step runbook (start MT, env vars, provision first tenant, link production), see [MULTITENANT-ONBOARDING.md](MULTITENANT-ONBOARDING.md).

## Environment variables

Set these in `.env.local` (or Vercel/env for deployed apps that use the MT project):

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_MT_URL` | Yes (for MT apps) | MT project URL (e.g. `https://<project-ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_MT_ANON_KEY` | Yes (for MT apps) | MT project anon/public key |
| `SUPABASE_MT_SERVICE_ROLE_KEY` | Yes (server-side tenant-scoped ops) | MT project service role key; **never** expose to client |
| `SUPABASE_MT_PROJECT_REF` | Optional | Project reference ID (e.g. for CI or Supabase CLI linking) |

## When to use MT vs legacy Supabase

- **Use the MT project** when:
  - Building or calling features that are tenant-scoped (MOOD MNKY, SAGE MNKY, CODE MNKY agent apps; future LABZ/Dojo tenant context).
  - Storing or querying `tenants`, `tenant_members`, `tenant_brand_copy`, `tenant_design_tokens`, `tenant_content`, or any other table that has `tenant_id`.
- **Use the existing Supabase** (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) when:
  - Working with the main app (web), Hydaelyn, or any flow that still uses the single-tenant DB (verse blog, profiles, formulas, Flowise, etc.).

## Rule: tenant_id only from server-validated context

- **Never** accept `tenant_id` from the client (query param, body, header) and use it in a query without validation.
- **Always** resolve tenant from one of:
  1. **URL slug** (e.g. `/t/[slug]`): resolve `slug` → `tenant_id` via `tenants.slug`, then verify the current user is a member (`tenant_members` or `is_tenant_member`).
  2. **Server-fetched profile**: e.g. `profiles.active_tenant_id` or membership list fetched server-side; verify the user is still a member before using.
- Use the server-side MT client factory with the resolved `tenant_id` for all tenant-scoped queries. See `packages/mt-supabase` (or app-level `lib/supabase-mt`) for `getMTSupabaseClient({ tenantId })` and helpers like `getTenantFromSlug`, `requireTenantMember`.

## Client-side usage

- For client-side code (e.g. React components) that need to read tenant-scoped data with RLS: create a Supabase client using `NEXT_PUBLIC_SUPABASE_MT_URL` and `NEXT_PUBLIC_SUPABASE_MT_ANON_KEY`. The session (auth) must be for the same Supabase project; RLS will restrict rows to the user’s tenants. Prefer resolving tenant in the server (e.g. from slug or `active_tenant_id`) and passing only safe identifiers to the client.

## Tenant provisioning

To create a new tenant (e.g. default tenant or a new brand), run from repo root:

```bash
pnpm provision-mt-tenant --slug SLUG --name "Name" --owner-id YOUR_USER_UUID [--seed-defaults]
```

For the **first organization (MOOD MNKY LLC)** as platform owner with full seed content:

```bash
pnpm provision-mt-tenant --slug mood-mnky --name "MOOD MNKY LLC" --owner-id YOUR_USER_UUID --platform-owner --seed-organization
```

Replace `YOUR_USER_UUID` with your **main Supabase** auth user id (e.g. from logged-in `/api/me` or Supabase Dashboard → Authentication → Users). On PowerShell, do not use angle brackets; use the raw UUID.

Requires `NEXT_PUBLIC_SUPABASE_MT_URL` and `SUPABASE_MT_SERVICE_ROLE_KEY`. Apply migrations first (so `is_platform_owner` exists). With `--seed-defaults`, seeds minimal rows in `tenant_brand_copy` and `tenant_design_tokens`. With `--seed-organization` (only when slug is `mood-mnky`), seeds full brand copy, design tokens, and tenant_content from `scripts/seed-data/mood-mnky-llc.ts`. Record the returned `tenantId` in the [Multi-Tenant Scope Register](MULTITENANT-SCOPE-REGISTER.md) as the default/platform-owner tenant. With `--platform-owner`, the script also inserts the owner ID into `platform_owner_external_users` so that user can call the Overseer API when authenticated with main Supabase.

## Production: overseer UUIDs

Overseer API callers are identified by **main** Supabase auth user ID; that ID is stored in the **MT** project’s `platform_owner_external_users`. Dev and prod use different main Supabase instances, so **UUIDs are not portable**: production overseers must be the **production** main Supabase user IDs. When you provision the first tenant in production with `--owner-id <prod-main-uuid> --platform-owner`, that UUID is added as the first production overseer. To add more: run `pnpm add-mt-overseer <PRODUCTION_MAIN_USER_UUID>` with production MT env vars, or insert the UUID in production MT’s `platform_owner_external_users` via Studio/SQL. See [MULTITENANT-ONBOARDING.md](MULTITENANT-ONBOARDING.md#production-overseer-uuids-cannot-copy-from-dev).

## Overseer API (apps/web)

Platform-owner members (or users in `platform_owner_external_users`) can list and update tenants via:

- **GET /api/mt/tenants** — List all tenants. Requires main Supabase session; MT checks `is_overseer(user_id)`.
- **PATCH /api/mt/tenants/[id]** — Update tenant status. Body: `{ "status": "active" | "suspended" | "archived" }`.

See [TENANT-LIFECYCLE-AND-GOVERNANCE.md](TENANT-LIFECYCLE-AND-GOVERNANCE.md).

## References

- [MULTITENANT-SUPABASE-SCHEMA-CONTRACT.md](MULTITENANT-SUPABASE-SCHEMA-CONTRACT.md) — schema and migration order
- [SUPABASE-MULTITENANT-READINESS-REPORT.md](SUPABASE-MULTITENANT-READINESS-REPORT.md) — existing project and migration path
- [TENANT-LIFECYCLE-AND-GOVERNANCE.md](TENANT-LIFECYCLE-AND-GOVERNANCE.md) — lifecycle and default tenant strategy
- [MULTITENANT-SCOPE-REGISTER.md](MULTITENANT-SCOPE-REGISTER.md) — tables and routes scope
