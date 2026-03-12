# @mnky/mt-supabase

Shared client and tenant resolution helpers for the **Multi-Tenant Supabase** (MT) project. Use in MOOD MNKY, SAGE MNKY, CODE MNKY apps and any app that needs tenant-scoped data.

## Setup

1. Set MT env vars (see [docs/ENV-MULTITENANT-SUPABASE.md](../../docs/ENV-MULTITENANT-SUPABASE.md)): `NEXT_PUBLIC_SUPABASE_MT_URL`, `SUPABASE_MT_SERVICE_ROLE_KEY`, etc.
2. Add dependency: `"@mnky/mt-supabase": "workspace:*"` in your app’s `package.json`.
3. Use **server-side only** (API routes, server components, server actions).

## API

- **createMTAdminClient()** — Supabase admin client for the MT project (service role). Use for tenant resolution and tenant-scoped queries; always filter by `tenant_id` when reading/writing tenant-scoped tables.
- **getMTSupabaseClient({ tenantId })** — Returns the same admin client; `tenantId` is for documentation. Callers must pass a server-validated `tenantId` and use it in every query.
- **getTenantFromSlug(slug)** — Resolves `tenants` by `slug`; returns tenant row or null.
- **requireTenantMember(tenantId, userId)** — Ensures user is a member; returns membership row or throws.
- **requireTenantAdmin(tenantId, userId)** — Ensures user is owner or admin; returns membership row or throws.
- **getTenantAndMembership(slug, userId)** — Resolves tenant by slug and validates membership in one call; throws if not found or not a member.

## Rule

Never accept `tenant_id` from the client. Always resolve from URL slug or server-fetched profile and validate membership.
