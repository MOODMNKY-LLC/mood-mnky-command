# Multi-Tenant Supabase (MT) Project

This directory contains the **dedicated multi-tenant Supabase project** used by MOOD MNKY LLC's brand ecosystem (MOOD MNKY, SAGE MNKY, CODE MNKY apps and future multi-tenant apps). Config and migrations live in `supabase-mt/supabase/` because the Supabase CLI expects a folder named `supabase` inside the project directory.

**Two Supabase setups in this repo:**

| Project | How to start | Studio URL | What you see |
|--------|--------------|------------|--------------|
| **Main (monorepo)** | From repo root: `pnpm supabase:start` or `supabase start` | http://127.0.0.1:54523 | apps/web, Hydaelyn, Dojo, LABZ — single-tenant DB |
| **Multi-tenant (MT)** | From repo root: `pnpm supabase-mt:start` or `supabase start --workdir supabase-mt` | http://127.0.0.1:54525 | tenants, tenant_members, tenant_brand_copy, etc. |

Do not mix MT migrations with the main project. They are separate databases.

## Run MT locally (see MT schema in Studio)

From **repo root** (do not `cd` into supabase-mt; the CLI uses `--workdir`):

```bash
pnpm supabase-mt:start
# or
supabase start --workdir supabase-mt
```

Then open **Studio for MT**: http://127.0.0.1:54525  

Copy the API URL and anon/service_role keys from the CLI output into `.env.local` as `NEXT_PUBLIC_SUPABASE_MT_URL`, `NEXT_PUBLIC_SUPABASE_MT_ANON_KEY`, `SUPABASE_MT_SERVICE_ROLE_KEY`.

To stop MT only: `pnpm supabase-mt:stop` or `supabase stop --workdir supabase-mt`.

## Applying migrations (cloud)

1. Create the MT Supabase project in the [Supabase Dashboard](https://supabase.com/dashboard) (or via CLI).
2. From repo root: `cd supabase-mt && supabase link --project-ref <MT_REF>` then `supabase db push`.
3. Or run the SQL in each file under `supabase-mt/supabase/migrations/` manually in the SQL Editor (in order).

**Structured onboarding:** [docs/MULTITENANT-ONBOARDING.md](../docs/MULTITENANT-ONBOARDING.md) — step-by-step runbook (start MT, env vars, provision first tenant, link production).

See [docs/ENV-MULTITENANT-SUPABASE.md](../docs/ENV-MULTITENANT-SUPABASE.md) for environment variables and [docs/MULTITENANT-SUPABASE-SCHEMA-CONTRACT.md](../docs/MULTITENANT-SUPABASE-SCHEMA-CONTRACT.md) for the schema contract.
