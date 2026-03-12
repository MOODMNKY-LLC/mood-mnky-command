# Multi-Tenant App Instances (Flowise, n8n, Postgres-backed)

This document describes how to use the MT Supabase project to store **per-tenant configuration** for external or Postgres-backed apps (e.g. Flowise, n8n) so different tenants can use different instances or databases.

## Table: `tenant_app_instances`

| Column | Type | Description |
|--------|------|-------------|
| `tenant_id` | uuid | FK to `tenants(id)`. |
| `app_type` | text | Identifier: `flowise`, `n8n`, or custom. One row per (tenant_id, app_type). |
| `base_url` | text | Base URL for the app (e.g. `https://flowise-tenant-a.moodmnky.com`, `https://n8n-tenant-b.example.com`). |
| `api_key_encrypted` | text | Optional; encrypt with project credentials encryption before storing. |
| `settings` | jsonb | Extra config, e.g. `database_url`, `workspace_id`, `webhook_secret`. |
| `created_at`, `updated_at` | timestamptz | Audit. |

RLS: tenant members can read; tenant admins can insert/update/delete. Server-side code uses the MT admin client with a resolved `tenant_id` to fetch config.

## Resolution pattern

1. **Resolve tenant** from request (slug, `active_tenant_id`, or session).
2. **Look up config** in MT: use helper `getTenantAppInstance(tenantId, 'flowise')` or `getTenantAppInstance(tenantId, 'n8n')` from `@mnky/mt-supabase` (server-side). Or query `tenant_app_instances` where `tenant_id = ?` and `app_type = 'flowise'` (or `'n8n'`).
3. **If a row exists:** use `base_url` (and optionally decrypt `api_key_encrypted`, use `settings`) for that tenant’s Flowise/n8n.
4. **If no row:** fall back to env (e.g. `FLOWISE_HOST`, `N8N_BASE_URL`) for backward compatibility and single-tenant mode.

This allows one shared Flowise/n8n URL for tenants that have no row, and per-tenant URLs (or multiple instances backed by Postgres) for tenants that do.

## Use cases

### Several Flowise instances (e.g. one per tenant)

- Deploy Flowise per tenant (or one per environment with workspace isolation).
- In MT, insert one `tenant_app_instances` row per tenant with `app_type = 'flowise'`, `base_url` = that tenant’s Flowise URL, and optional `api_key_encrypted`.
- LABZ (or any app) resolves tenant, fetches the row, and calls the tenant’s Flowise base URL for chatflows, tools, etc.

### Several n8n instances backed by Postgres (e.g. Supabase)

- Run n8n with Postgres; each tenant can have its own n8n instance pointing at the same Supabase (different DB or schema) or at MT Supabase with tenant-scoped data.
- In MT, store `app_type = 'n8n'`, `base_url`, and in `settings` optionally `database_url` or a reference (e.g. tenant’s schema name).
- App resolves tenant → reads `tenant_app_instances` → uses that tenant’s n8n URL and credentials.

### Single shared Flowise/n8n (current behavior)

- Do **not** create rows in `tenant_app_instances` for the default tenant (or any tenant). The app continues to use `FLOWISE_HOST`, `N8N_BASE_URL`, etc. from env.

## Backoffice and provisioning

- **Platform → App Instances** (`/platform/app-instances`): Select a tenant, then list/add/edit/delete rows in `tenant_app_instances` (app type, base URL, settings JSON). Overseer-only. See [LABZ-BACKOFFICE.md](admin/LABZ-BACKOFFICE.md). “Tenant app instances” section (or per-tenant “Integrations” tab) could list/edit rows in `tenant_app_instances` for the selected tenant (Flowise URL, n8n URL, optional API key).
- **Provisioning:** When creating a new tenant, you can optionally insert default `tenant_app_instances` rows (e.g. from a template or env) so the new tenant gets its own Flowise/n8n URLs once those instances are deployed.

## Security

- **API keys:** Store in `api_key_encrypted` using the project’s credentials encryption (e.g. `lib/credentials-encrypt`). Never expose raw keys to the client.
- **RLS:** Only members of the tenant can read the row; only admins can write. Server-side code that needs to read for any tenant (e.g. LABZ resolving tenant from slug) uses the MT service role and passes a server-validated `tenant_id`.

## References

- [MULTITENANT-SCOPE-REGISTER.md](MULTITENANT-SCOPE-REGISTER.md) — table and API scope
- [MULTITENANT-SUPABASE-SCHEMA-CONTRACT.md](MULTITENANT-SUPABASE-SCHEMA-CONTRACT.md) — migration order and RLS rules
- [ENV-MULTITENANT-SUPABASE.md](ENV-MULTITENANT-SUPABASE.md) — MT env and client usage
