# AGENT:TODO — Portal v1.5 and Stack Infra

Single source of truth for **agent-actionable todos**, **environment variables**, and **credential workflow** across the MOOD MNKY Portal, Docker Compose stack, and Ansible provisioning.

**Credentials and Notion:** We use the **Notion plugin** to access the **MOOD MNKY credentials database** to find, store, retrieve, and copy needed project secrets to and from `.env.local` and other environment variable files (e.g. `supabase-mt/.env.local`, `docker-compose/.env`, provisioning vault or env). When adding or changing env vars, update Notion and this file. See portal docs **BACKOFFICE-FLOWISE-N8N** → “Notion credential workflow” for the step-by-step.

**Portal env file (avoids wrong-file edits):** The canonical env file for the portal is **`supabase-mt/.env.local`** (one level up from `portal/`). When updating it, use the **full path** (e.g. `supabase-mt/.env.local`) or the **Filesystem MCP** so you edit that file explicitly; editing "`.env.local`" from a context inside `portal/` can otherwise target the wrong file and cause credentials to appear unset in the Launch Wizard and backoffice.

---

## Outstanding todos

| ID | Summary | Area | Priority | Assignable |
|----|---------|------|----------|------------|
| T1 | Document Notion credential workflow in portal docs (BACKOFFICE or BACKOFFICE-FLOWISE-N8N) | docs | P0 | docs — Done: BACKOFFICE-FLOWISE-N8N § Notion credential workflow |
| T2 | Harden `getEnvFromFile` path for different CWDs or document that portal must be run from `supabase-mt/portal` | portal | P1 | code-mnky — Done: portal/lib/env-file.ts + refactors |
| T3 | Optional: add env validation script for portal (required vars before dev) | portal | P2 | code-mnky — Done: portal/scripts/check-env.mjs, pnpm run check-env |
| T4 | Optional: add AI gateway to roadmap (reference CHATGPT-MOODMNKY-PORTAL-INFRA.md) | infra | P2 | sage-mnky — Done: AGENT-TODO References § Roadmap |
| T5 | Keep AGENT:TODO.md and READMEs (docker-compose, provisioning, portal) in sync when env or runbooks change | docs | P1 | docs — When adding/renaming vars or runbooks, update this file and the relevant README (docker-compose/, provisioning/, portal/) |
| T6 | Add app factory env vars to Notion credentials DB and AGENT-TODO matrix (GITHUB_TOKEN, confirm COOLIFY_*) | docs / ops | P0 | docs — Done: Notion has GitHub + Coolify rows; AGENT-TODO § Credentials used (App Factory) updated |
| T7 | Document deployment spec JSON schema and template manifest format (for generator) | docs | P1 | docs — Done: portal/docs/APP-FACTORY-DEPLOYMENT-SPEC.md |

---

## Environment variables matrix

| Variable | Used by | Required | Where set | Notes |
|----------|---------|----------|-----------|-------|
| `NEXT_PUBLIC_SUPABASE_MT_URL` | portal | Yes | .env.local | MT project API URL (Supabase Dashboard or `supabase status`) |
| `NEXT_PUBLIC_SUPABASE_MT_ANON_KEY` | portal | Yes | .env.local | MT anon key |
| `SUPABASE_MT_SERVICE_ROLE_KEY` | portal | Yes | .env.local | MT service role key (server-only) |
| `SUPABASE_MANAGEMENT_API_TOKEN` | portal | For proxy/AI SQL | .env.local | Supabase Dashboard → Account → Access Tokens |
| `OPENAI_API_KEY` | portal | For AI SQL | .env.local | Used by /api/ai/sql |
| `NEXT_PUBLIC_ENABLE_AI_QUERIES` | portal | No | .env.local | Feature flag for AI query UI (default: false) |
| `NEXT_PUBLIC_MAIN_APP_URL` | portal | No | .env.local | Footer links (default: https://www.moodmnky.com) |
| `NEXT_PUBLIC_DOCS_URL` | portal | No | .env.local | Docs link |
| `SUPABASE_MT_PROJECT_REF` | portal | No | .env.local | For CI / supabase link |
| `NEXT_PUBLIC_SUPABASE_MT_PROJECT_REF` | portal | For backoffice UI | .env.local | Project ref for Admin > Supabase backoffice |
| `FLOWISE_URL` | portal | For back office | .env.local | Native default Flowise instance URL |
| `FLOWISE_API_KEY` | portal | For back office | .env.local | Flowise Settings → API Keys (same instance as FLOWISE_URL) |
| `FLOWISE_SECRETKEY` / `FLOWISE_APIKEY` | portal | Fallback | .env.local | Alternative key names |
| `N8N_URL` | portal | For back office | .env.local | Native default n8n instance URL |
| `N8N_API_KEY` | portal | For back office | .env.local | n8n Settings → API |
| `MINIO_ENDPOINT` or `S3_ENDPOINT_URL` | portal | For back office MinIO | .env.local | S3 endpoint (e.g. http://localhost:9000) |
| `MINIO_ROOT_USER` or `S3_STORAGE_ACCESS_KEY_ID` | portal | For back office MinIO | .env.local | MinIO access key |
| `MINIO_ROOT_PASSWORD` or `S3_STORAGE_SECRET_ACCESS_KEY` | portal | For back office MinIO | .env.local | MinIO secret key |
| `S3_STORAGE_REGION` / `AWS_REGION` | portal (MinIO) | No | .env.local | Default us-east-1 |
| `S3_FORCE_PATH_STYLE` / `MINIO_FORCE_PATH_STYLE` | portal (MinIO) | No | .env.local | true for MinIO |
| `NEXTCLOUD_URL` | portal | For back office Nextcloud | .env.local | Nextcloud base URL |
| `NEXTCLOUD_ADMIN_USER` | portal | For back office Nextcloud | .env.local | Admin username |
| `NEXTCLOUD_ADMIN_PASSWORD` or `NEXTCLOUD_ADMIN_APP_PASSWORD` | portal | For back office Nextcloud | .env.local | Admin or app password |
| `PROXMOX_API_HOST` | portal, provisioning | Yes | .env.local / vault | Proxmox host (e.g. 10.0.0.10:8006 for LAN, or proxmox-data.moodmnky.com for Vercel). Portal uses for dashboard proxy. |
| `PROXMOX_API_USER` | portal, provisioning | Fallback | .env.local / vault | e.g. root@pam. Used for ticket auth when token not set. |
| `PROXMOX_API_PASSWORD` | portal, provisioning | If no token | .env.local / vault | Password for ticket auth (POST /access/ticket). |
| `PROXMOX_API_TOKEN_ID` | portal, provisioning | If no password | .env.local / vault | API token (e.g. user@pam!tokenid). Prefer token for portal proxy. |
| `PROXMOX_API_TOKEN_SECRET` | portal, provisioning | If no password | .env.local / vault | Token secret. Portal: PVEAPIToken=TOKEN_ID=SECRET. |
| `PROXMOX_NODE` | provisioning | Yes | .env / vault | Node name (e.g. pve) |
| `PROXMOX_STORAGE` | provisioning | No | .env / vault | Default local-lvm |
| `PROXMOX_TEMPLATE_VM` | provisioning | Yes | .env / vault | VM template to clone |
| `COOLIFY_URL` | portal | For Coolify integration | .env.local | Local: http://10.0.0.115:8000. Production: https://coolify-hq.moodmnky.com (set in Vercel). |
| `COOLIFY_API_HOST` | portal | No | .env.local | Production hostname: coolify-hq.moodmnky.com (used if COOLIFY_URL not set in prod). |
| `COOLIFY_API_KEY` | portal | For Coolify API | .env.local | From Coolify UI → Keys & Tokens → API tokens. Authorization: Bearer \<key\>. |
| `GITHUB_TOKEN` or `GITHUB_ACCESS_TOKEN` | portal (App Factory) | For MVP repo creation | .env.local, Notion | GitHub PAT with `repo` scope. Create repo per customer app and push generated code. Sourced from Notion Credentials DB. |
| `APP_FACTORY_TEMPLATE_PATH` | portal (App Factory generator) | No | .env.local | Path to local template directory. If unset, generator uses `template_registry.source_path` (e.g. `infra/templates/nextjs/platforms`) or fallback `temp/platforms`. When set and valid, generated app is a copy of this template (with name/slug/env substitutions) so Coolify gets a full Next.js app with proper build/start scripts. |
| `APP_FACTORY_COOLIFY_PROJECT_NAME` | portal (App Factory deploy) | No | .env.local | Coolify project name to use when deployment spec does not set coolify_project_uuid (e.g. "MOOD MNKY Portal"). Resolved via Coolify API list projects; if not set, first project is used. |
| `APP_FACTORY_ROOT_DOMAIN` | portal (App Factory) | Yes for platform URL | .env.local | Root domain (e.g. `moodmnky.com`) for subdomain-per-app. Wizard shows `https://<slug>.<root>`; pipeline sends that domain to Coolify and sets NEXT_PUBLIC_ROOT_DOMAIN / NEXT_PUBLIC_APP_URL on the app so the deployed app does not default to localhost. |
| Compose vars (POSTGRES_*, MINIO_*, FLOWISE_*, N8N_*, etc.) | docker-compose, provisioning | Per README | docker-compose/.env, target host | See docker-compose/.env.example |

### Full-stack (temp/full-stack)

The **full-stack** compose (`temp/full-stack/docker-compose.full-stack.yml`) uses Supabase self-hosted + Flowise + n8n + MinIO. Reference env: **`temp/full-stack/env.full-stack`** — copy to `.env` next to the compose file and adjust.

| Variable / group | Required | Notes |
|------------------|----------|--------|
| `POSTGRES_PASSWORD` | Yes | Supabase DB |
| `JWT_SECRET` | Yes | Supabase Auth |
| `ANON_KEY`, `SERVICE_ROLE_KEY` | Yes | From Supabase Dashboard or `supabase status` |
| Flowise (`FLOWISE_PASSWORD`, queue/worker env) | Yes | Per env.full-stack |
| n8n (`N8N_BASIC_AUTH_PASSWORD`, etc.) | Yes | Per env.full-stack |
| MinIO (`MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`) | Yes | S3 for Supabase Storage |
| `OPENAI_API_KEY` | No | Blank in template; set if using OpenAI nodes |
| SMTP / domain / secure cookies | Production | Override for production; see FULL-STACK-RUNBOOK |

**Secrets:** Do not commit real secrets. Keep `env.full-stack` as a template with placeholders; production values go in `.env` on the deploy server or in Coolify application env.

---

## Credentials used (App Factory)

- **GITHUB_TOKEN** (in `supabase-mt/.env.local`): Retrieved from Notion **MOOD MNKY Credentials** database, row **Parent Program: GitHub**, **Use Cases: MOOD MNKY**. Notion page URL: [GitHub](https://www.notion.so/a3751d345645468792f1a1f3e00a4271). Key stored in **Key Code** property. Token was copied on 2026-03-07. **Test:** On Windows, `curl` to `https://api.github.com/user` may fail with `CRYPT_E_NO_REVOCATION_CHECK`; verify token on Linux/CI or in portal when repo creation is implemented.
- **COOLIFY_API_KEY** (in `supabase-mt/.env.local`): Retrieved from Notion **MOOD MNKY Credentials** database, row **Parent Program: Coolify**, **Use Cases: API Token** (Examples: MOOD MNKY: Portal). Notion page URL: [Coolify](https://www.notion.so/31ccd2a6542280b69aa1ef8f22088b8f). Key stored in **Key Code** property. Copy to `COOLIFY_API_KEY` in `supabase-mt/.env.local`; set `COOLIFY_URL` (e.g. `http://10.0.0.115:8000` or `https://coolify-hq.moodmnky.com`) in the same file.

---

## Notion credentials

- **Notion plugin** + **MOOD MNKY credentials database**: use for syncing secrets to:
  - **`supabase-mt/.env.local`** (canonical for portal; use full path or Filesystem MCP when editing)
  - `docker-compose/.env` (for local stack runs)
  - Provisioning: Ansible Vault or env files (never commit)
- When adding or changing a variable listed in the matrix above, update the credentials database in Notion and keep this file in sync.

---

## Portal env path behavior

- **getEnvFromFile** (used in `backoffice-instance.ts`, `backoffice-minio.ts`, `env-defaults/route.ts`) resolves `.env.local` as `join(cwd, "..", ".env.local")`. So when the Next.js server runs with CWD = `supabase-mt/portal`, it reads `supabase-mt/.env.local`. If the dev server is started from repo root or another directory, CWD may differ and the fallback may not find the file. **Recommendation:** run the portal from `supabase-mt/portal` (e.g. `pnpm dev` there) or ensure `.env.local` is loaded by the shell/dotenv before the process starts so `process.env` is populated.

---

## References

- [CHATGPT-MOODMNKY-PORTAL-INFRA.md](CHATGPT-MOODMNKY-PORTAL-INFRA.md) — reference architecture (planes, zones, Coolify, AI gateway). **Roadmap:** AI gateway (custom service for tenant-aware AI orchestration) is on the roadmap; see “AI plane” and “AI orchestration” in that doc.
- [portal/.env.example](portal/.env.example) — Portal env template
- [docker-compose/.env.example](docker-compose/.env.example) — Compose env template
- [provisioning/README.md](provisioning/README.md) — Ansible + Proxmox env and playbooks
- [portal/docs/BACKOFFICE-FLOWISE-N8N.md](portal/docs/BACKOFFICE-FLOWISE-N8N.md) — Back office API and credentials
- [portal/docs/BACKOFFICE.md](portal/docs/BACKOFFICE.md) — Back office overview
- [portal/docs/BACKOFFICE-PROXMOX.md](portal/docs/BACKOFFICE-PROXMOX.md) — Proxmox dashboard and proxy
- [../docs/CURSOR-PORTAL-INFRA-ASSIGNMENTS.md](../docs/CURSOR-PORTAL-INFRA-ASSIGNMENTS.md) — Agent/command/skill assignments for portal and infra
