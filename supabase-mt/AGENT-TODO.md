# AGENT:TODO — Portal v1.5 and Stack Infra

Single source of truth for **agent-actionable todos**, **environment variables**, and **credential workflow** across the MOOD MNKY Portal, Docker Compose stack, and Ansible provisioning.

**Credentials and Notion:** We use the **Notion plugin** to access the **MOOD MNKY credentials database** to find, store, retrieve, and copy needed project secrets to and from `.env.local` and other environment variable files (e.g. `portal/.env.local`, `docker-compose/.env`, provisioning vault or env). When adding or changing env vars, update Notion and this file.

---

## Outstanding todos

| ID | Summary | Area | Priority | Assignable |
|----|---------|------|----------|------------|
| T1 | Document Notion credential workflow in portal docs (BACKOFFICE or BACKOFFICE-FLOWISE-N8N) | docs | P0 | docs |
| T2 | Harden `getEnvFromFile` path for different CWDs or document that portal must be run from `supabase-mt/portal` | portal | P1 | code-mnky |
| T3 | Optional: add env validation script for portal (required vars before dev) | portal | P2 | code-mnky |
| T4 | Optional: add AI gateway to roadmap (reference CHATGPT-MOODMNKY-PORTAL-INFRA.md) | infra | P2 | sage-mnky |
| T5 | Keep AGENT:TODO.md and READMEs (docker-compose, provisioning, portal) in sync when env or runbooks change | docs | P1 | docs |

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
| Compose vars (POSTGRES_*, MINIO_*, FLOWISE_*, N8N_*, etc.) | docker-compose, provisioning | Per README | docker-compose/.env, target host | See docker-compose/.env.example |

---

## Notion credentials

- **Notion plugin** + **MOOD MNKY credentials database**: use for syncing secrets to:
  - `portal/.env.local` (or repo root `.env.local` used by portal)
  - `docker-compose/.env` (for local stack runs)
  - Provisioning: Ansible Vault or env files (never commit)
- When adding or changing a variable listed in the matrix above, update the credentials database in Notion and keep this file in sync.

---

## Portal env path behavior

- **getEnvFromFile** (used in `backoffice-instance.ts`, `backoffice-minio.ts`, `env-defaults/route.ts`) resolves `.env.local` as `join(cwd, "..", ".env.local")`. So when the Next.js server runs with CWD = `supabase-mt/portal`, it reads `supabase-mt/.env.local`. If the dev server is started from repo root or another directory, CWD may differ and the fallback may not find the file. **Recommendation:** run the portal from `supabase-mt/portal` (e.g. `pnpm dev` there) or ensure `.env.local` is loaded by the shell/dotenv before the process starts so `process.env` is populated.

---

## References

- [CHATGPT-MOODMNKY-PORTAL-INFRA.md](CHATGPT-MOODMNKY-PORTAL-INFRA.md) — reference architecture (planes, zones, Coolify, AI gateway)
- [portal/.env.example](portal/.env.example) — Portal env template
- [docker-compose/.env.example](docker-compose/.env.example) — Compose env template
- [provisioning/README.md](provisioning/README.md) — Ansible + Proxmox env and playbooks
- [portal/docs/BACKOFFICE-FLOWISE-N8N.md](portal/docs/BACKOFFICE-FLOWISE-N8N.md) — Back office API and credentials
- [portal/docs/BACKOFFICE.md](portal/docs/BACKOFFICE.md) — Back office overview
- [portal/docs/BACKOFFICE-PROXMOX.md](portal/docs/BACKOFFICE-PROXMOX.md) — Proxmox dashboard and proxy
- [../docs/CURSOR-PORTAL-INFRA-ASSIGNMENTS.md](../docs/CURSOR-PORTAL-INFRA-ASSIGNMENTS.md) — Agent/command/skill assignments for portal and infra
