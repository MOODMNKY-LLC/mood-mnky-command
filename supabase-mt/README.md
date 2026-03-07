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

---

## Back office, stack, and provisioning

This project also includes the **Portal** (Next.js back office), the **Docker Compose stack** (Flowise, n8n, Postgres, Redis, MinIO, optional Ollama/Qdrant), and **Ansible + Proxmox provisioning** for full-stack requests. Each has its own README:

| Area | Location | README | Purpose |
|------|----------|--------|---------|
| **Portal** | `portal/` | (see portal app docs) | Next.js app: auth, dashboard, app instances (Flowise, n8n, MinIO, Nextcloud), stack subscription requests. |
| **Docker Compose stack** | `docker-compose/` | [docker-compose/README.md](docker-compose/README.md) | Run Flowise, n8n, Postgres, Redis, MinIO; optional profiles for Ollama and Qdrant. Choose a profile (base, Core, Agent, GPU) and start services. |
| **Provisioning** | `provisioning/` | [provisioning/README.md](provisioning/README.md) | Ansible playbooks: create a VM on Proxmox, then deploy the Docker Compose stack on that VM. Used when partners request the full MOOD MNKY DevOps/Agent stack from the portal. |

**Flow in short:** Partners use the portal to manage app instances (and optionally request a full stack). The stack runs via Docker Compose (locally or on a provisioned VM). Provisioning automates VM creation and stack deploy on Proxmox; the platform admin runs the playbooks and updates subscription status in the portal.

**Agent-actionable todos and env reference:** See [AGENT:TODO](../AGENT-TODO.md) (repo root) for outstanding todos, environment variable matrix, and Notion credentials workflow.

---

## Deploying the Portal to Vercel

**mood-mnky-command** is the monorepo; it houses several projects (e.g. in `apps/`). The **MT portal** is different: it lives under **supabase-mt/** and has its own Supabase project (this directory), so it is not in `apps/`.

For the **Vercel project that deploys the MT portal** (its own project, linked to the same repo):

1. **Root Directory:** In that project’s [Vercel → Settings → General](https://vercel.com/dashboard), set **Root Directory** to **`supabase-mt/portal`**. (If it stays `.`, Vercel builds from repo root, where there is no Next.js app for the portal, and the build fails.)
2. **Install/Build:** `portal/vercel.json` sets:
   - **Install Command:** `cd ../.. && pnpm install` — runs from monorepo root so workspace dependencies (e.g. `@mnky/mt-supabase`) resolve.
   - **Build Command:** `pnpm run build` (Next.js build in the portal directory).

After setting Root Directory, trigger a new deployment (push a commit or redeploy). To deploy from the CLI with the full repo, run from **monorepo root**: `vercel deploy --prod --archive=tgz` (avoids the 15k-file upload limit); use the project that targets the portal.

**If you see `ERR_PNPM_OUTDATED_LOCKFILE`:** Ensure the latest `pnpm-lock.yaml` is committed at monorepo root and redeploy. The repo root `vercel.json` uses `pnpm install --no-frozen-lockfile` when building from root so install can succeed; the proper fix is still to set Root Directory to **`supabase-mt/portal`** so the correct app is built.
