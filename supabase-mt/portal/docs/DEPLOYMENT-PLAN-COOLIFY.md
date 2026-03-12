# Deployment Plan: Docker Compose Stack and Coolify

This document outlines how Coolify can run both the **server/Docker** parts (Docker Compose agent stack) and the **frontend/serverless** parts (Next.js portal and App Factory–generated apps). It also assigns Cursor agents, tools, commands, rules, and skills relevant to App Factory and this deployment work.

---

## 1. Stack Overview

### 1.1 Docker Compose stack (server / long-running services)

Location: [`supabase-mt/docker-compose/docker-compose.yml`](../../docker-compose/docker-compose.yml).

| Layer | Services | Notes |
|-------|----------|--------|
| Base | postgres, redis, minio | Shared by Flowise and n8n; MinIO for S3-compatible storage. |
| Apps | flowise, n8n | Flowise (port 3000), n8n (5678); both use postgres + redis; optional MinIO. |
| Profiles | cpu / agent / gpu-nvidia / gpu-amd | cpu: ollama-cpu; agent: + qdrant + ollama-cpu; gpu-*: GPU Ollama. |

Profiles: `docker compose --profile cpu up -d` or `--profile agent up -d`. The stack is **not** Supabase MT (that is a separate Supabase project); this Postgres is for Flowise/n8n only.

### 1.2 Frontend / serverless parts

- **Portal (Next.js)**  
  The back office and App Factory UI (`supabase-mt/portal`). Can be deployed as:
  - **Vercel** (or similar): serverless Next.js; env from Vercel; Coolify API called from server actions/API routes.
  - **Coolify**: single Next.js app (Nixpacks or Dockerfile), env from Coolify application env.

- **App Factory–generated apps**  
  Per-tenant or per-project Next.js apps (e.g. from `platforms` or `nextjs-mt-starter` template). Deployed via Coolify: generator pushes to GitHub, Coolify creates application from repo (Nixpacks). **Compose stacks (e.g. agent-stack):** compose content is stored in Supabase (`compose_stacks` table), retrieved in-app, and sent to Coolify via **POST /applications/dockercompose** (`docker_compose_raw`). No Git repo is created for Compose deploys; templates are version-controlled in the repo and periodically synced into Supabase via `syncComposeStack(templateKey)` (platform admin).

### 1.3 Full-stack (Supabase self-hosted + Flowise + n8n)

Location: [`supabase-mt/temp/full-stack/docker-compose.full-stack.yml`](../../temp/full-stack/docker-compose.full-stack.yml).

Single compose that adds **Supabase self-hosted** (db, kong, auth, rest, realtime, storage, studio, analytics, pooler, vector) to Flowise (queue + worker) and n8n (with external runners) + MinIO. Use when you need a full backend (auth, DB, storage, Flowise, n8n) in one deployment.

| Layer | Services | Notes |
|-------|----------|--------|
| Supabase core | db, kong, auth, rest, realtime, storage, studio, analytics, pooler, vector | Requires `./volumes/` from Supabase self-hosted repo (Kong config, DB init SQL, pooler, vector). |
| Flowise | flowise, flowise-worker | Queue mode with Redis; worker for scaling. |
| n8n | n8n + external runners | Runner image version should match n8n. |
| Storage | minio, minio-createbucket | S3 for Supabase Storage and optional Flowise/n8n. |

**When to use:** Full-stack when you need self-hosted Supabase (auth, DB, storage) plus Flowise and n8n in one stack. Use the lighter **agent-stack** (1.1) when you only need Flowise + n8n + Postgres/Redis/MinIO (no Supabase self-hosted).

**Coolify deploy:** Deploying this stack via Coolify requires the build context or server to include the Supabase `./volumes/` tree; otherwise Supabase services will not boot. See [FULL-STACK-RUNBOOK.md](./FULL-STACK-RUNBOOK.md) for setup, volumes, and Coolify caveats.

---

## 2. Coolify Handling Both Server and Frontend Parts

Coolify can manage:

1. **Docker Compose (server parts)**  
   - In Coolify: create a **Docker Compose** resource.  
   - Point it at a repo (or build context) that contains the stack, e.g. `docker-compose.yml` (and optional `docker-compose.override.yml` for env).  
   - Use the same file as in the repo, or a dedicated “deploy” compose that composes the main file with production overrides.  
   - Coolify runs `docker compose up` on the server; profiles can be passed via build/deploy env (e.g. `COMPOSE_PROFILES=cpu` or `agent`).  
   - **Result:** One Coolify “application” = the full Compose stack (postgres, redis, minio, flowise, n8n, optional qdrant/ollama).

2. **Next.js portal (frontend)**  
   - In Coolify: create an **Application** from the monorepo (or a portal-only repo).  
   - Build: Nixpacks (Node) or Dockerfile; root or subpath `supabase-mt/portal`.  
   - Env: `COOLIFY_*`, `GITHUB_TOKEN` (if needed), Supabase, etc., from Coolify application env.  
   - **Result:** Portal runs on Coolify; server actions and API routes call Coolify API and GitHub from the same env.

3. **Coolify projects as tenant namespaces**  
   - The Coolify API supports **POST /projects** (create) and **GET /projects** (list). Each project is a namespace for applications.
   - We use **one Coolify project per tenant**: when deploying an app, if the deployment spec does not set `coolify_project_uuid`, the pipeline resolves the tenant’s Coolify project (stored in `tenants.coolify_project_uuid`). If missing, it creates a Coolify project via the API and saves the UUID on the tenant. All that tenant’s App Factory apps then live in that one Coolify project.
   - So in Coolify UI you see one project per tenant (e.g. “Acme Corp”) containing all of that tenant’s apps. The deployment spec can still override with an explicit `coolify_project_uuid` if needed.

4. **Generated apps (frontend / per-tenant)**  
   - Already implemented: App Factory creates repo and Coolify application, deploys via Nixpacks (platforms) or Compose (agent-stack).  
   - No change required for “Coolify handling frontend parts”; it already does.

So:

- **Server parts** → one Coolify Compose resource (or one Compose app per environment).  
- **Frontend parts** → Portal as one Coolify app; generated apps as one Coolify app each.  
- **Context7:** Use for up-to-date [Coolify API](https://coolify.io/docs/api-reference/api) and [GitHub API](https://docs.github.com/en/rest) when adding endpoints or debugging; connectivity checks use `GET /user` (GitHub) and `GET /api/v1/servers` (Coolify).

---

## 3. Deployment Plan (Steps)

1. **Prepare Compose for Coolify**  
   - Ensure `docker-compose.yml` (and any override) is in a repo or path Coolify can use.  
   - Document required env (postgres, redis, minio, flowise, n8n, optional ollama/qdrant) in a single env example (e.g. `.env.example` in that directory).  
   - If using profiles, document `COMPOSE_PROFILES` (e.g. `cpu` or `agent`) and set it in Coolify application env.

2. **Create Coolify Compose resource**  
   - In Coolify: New Resource → Docker Compose; connect repo (or upload).  
   - Set env vars (from step 1); set `COMPOSE_PROFILES` if needed.  
   - Deploy; verify postgres, redis, flowise, n8n (and optional qdrant/ollama) are reachable.

3. **Deploy Portal on Coolify (optional)**  
   - New Application from repo; build config = Nixpacks or Dockerfile for `supabase-mt/portal`.  
   - Set portal env (Supabase, `COOLIFY_URL`, `COOLIFY_API_KEY`, `GITHUB_TOKEN`, etc.).  
   - After deploy, App Factory launch page connectivity checks (GitHub + Coolify) should pass if env is set.

4. **Keep App Factory flow as-is**  
   - Generated apps continue to be created and deployed via Coolify from the Launch Wizard; no change to that flow.

5. **Healthchecks and connectivity**  
   - Launch page already shows **GitHub integration** and **Coolify server** status via server-side pings (GitHub `users.getAuthenticated`, Coolify `GET /api/v1/servers`).  
   - No token names are shown; only “connected” / “disconnected”.  
   - For deeper healthchecks (e.g. Flowise/n8n), add optional server action or API route that calls Flowise/n8n health endpoints and surface in Admin → App instances or a dedicated status page later.

6. **Compose in Supabase and sync from repo**  
   - Compose YAML is stored in `compose_stacks` (template_key, name, content).  
   - To pull updated versions from the repo: call the server action **`syncComposeStack(templateKey)`** (e.g. `syncComposeStack("agent-stack")` or `syncComposeStack("full-stack")`). For agent-stack this reads `docker-compose.yml` from the template's `source_path`; for full-stack it reads `docker-compose.full-stack.yml` from `temp/full-stack`. Platform admin only. Run periodically (e.g. from Admin UI or a cron-triggered job) so deployment-ready content in Supabase stays in sync with the repo. **Full-stack deploy via Coolify** still requires the server to have the Supabase `./volumes/` tree; see FULL-STACK-RUNBOOK.  
   - **Port conflicts (MinIO 9000):** When syncing, the stored compose is transformed to **omit MinIO host port bindings** (9000/9001) so multiple stacks on the same Coolify host do not hit "port is already allocated". MinIO remains reachable at `http://minio:9000` inside the stack. After changing the sync logic or the repo compose, re-run **Sync compose** so new deploys use the updated content.

---

## 3.1 How to deploy the updated agent-stack

After you change `docker-compose/docker-compose.yml` or `docker-compose/scripts/flowise-entrypoint.sh` in the repo:

1. **Sync compose to Supabase**  
   - In the Portal: **Dashboard → Back office / Admin** (or App Factory admin).  
   - Use **Sync compose (agent-stack)** so the latest YAML is read from the repo (`docker-compose/docker-compose.yml`) and upserted into `compose_stacks`.  
   - This makes the updated compose (including Flowise entrypoint and script volume) the one used for the next deploy.

2. **Redeploy or create new**  
   - **Redeploy existing Coolify Compose app:** In Coolify, open the agent-stack application and trigger **Redeploy**. Coolify will use the compose it already has; if that compose was created from **raw YAML** (App Factory), it was sent at create time, so you must **create a new** Compose app (step 2b) to get the updated YAML.  
   - **Create new via App Generator:** In the Portal, go to **App Factory → Generate app**, choose template **Agent Stack**, fill tenant/app name and slug, then **Create and deploy**. The pipeline will fetch the compose from `compose_stacks` (after sync) and send it to Coolify via **POST /applications/dockercompose** (base64-encoded).

3. **Flowise entrypoint and `scripts/` (raw compose caveat)**  
   - The agent-stack compose mounts `./scripts:/scripts:ro` and runs Flowise with `/scripts/flowise-entrypoint.sh` (Postgres check → SQLite fallback).  
   - When Coolify runs the stack from **raw YAML** (App Factory), it runs `docker compose` in a project directory that does **not** contain the repo’s `scripts/` folder. So the mount is empty and the entrypoint script is missing; Flowise can fail with “no such file” or similar.  
   - **Options:**  
     - **Deploy from Git:** In Coolify, create a **Docker Compose** resource from the **repository** (e.g. `mood-mnky-command`), set **Base directory** to `supabase-mt/docker-compose` and **Docker Compose location** to `docker-compose.yml`. Then Coolify clones the repo and `./scripts` exists at run time; the entrypoint works.  
     - **Raw compose (App Factory):** If you keep deploying via App Factory (raw YAML), consider a compose variant for Coolify that does **not** use the entrypoint (e.g. set Flowise `DATABASE_TYPE=postgres` and `DATABASE_HOST=postgres` in the YAML and remove the script volume) so Flowise starts without `/scripts`. Fallback would then be disabled for that deploy.  
   - See [docker-compose/README](../../docker-compose/README.md) for local run and script requirements.

---

## 4. Cursor: Agents, Tools, Commands, Rules, Skills (App Factory & Deployment)

Assignments below apply to both **agent-stack** and **full-stack**; full-stack-specific callouts are in the right column.

### 4.1 Agents (`.cursor/agents/`)

| Agent | Agent stack | Full-stack |
|-------|-------------|------------|
| **code-mnky** | Coolify API, compose sync, pipeline, port fixes (e.g. 5432), tenant Coolify project. | Same + full-stack compose wiring, env mapping, optional volumes doc/scripts. |
| **sage-mnky** | Architecture: Compose vs Nixpacks, tenant namespaces, env strategy. | Architecture: when to use full-stack vs agent-stack, Supabase self-hosted vs hosted, volumes strategy. |
| **docs** | BACKOFFICE-COOLIFY, APP-FACTORY-DEPLOYMENT-SPEC, DEPLOYMENT-PLAN-COOLIFY, AGENT-TODO. | Same + FULL-STACK-RUNBOOK, temp/full-stack README. |
| **discord-agent** | Only if deployment/App Factory status is exposed in Discord. | Same. |
| **shopify** | Not for stacks; theme/LABZ/storefront only. | Same. |

### 4.2 Rules (`.cursor/rules/`)

| Rule | Assignment |
|------|------------|
| **deep-thinking.mdc** | Use for deep research on: full-stack vs agent-stack, volumes and deployability, production patterns for Flowise queue and n8n runners; follow three stop points and research cycles when updating the agent stack with full-stack. |
| **project-and-standards.mdc** | No new tech without approval; reuse existing Coolify/compose patterns. |
| **mcp-tool-usage.mdc** | Context7 for Coolify/GitHub API; Fetch/FireCrawl for docs. |
| **database-rules.mdc** | Supabase dev only; template_registry/compose_stacks changes. |
| **code-mnky.mdc** | When CODE MNKY agent is used for implementation. |
| **create-migration.mdc** / **create-rls-policies.mdc** | When adding or changing template_registry, compose_stacks, or app_factory-related schema. |

### 4.3 Skills (`.cursor/skills/`)

| Skill | Agent stack | Full-stack |
|-------|-------------|------------|
| **backend-development** | Coolify client, GitHub client, server actions, connectivity. | Same + env design for Supabase + Flowise + n8n. |
| **database-design** | deployment_specs, template_registry, compose_stacks, tenants.coolify_project_uuid. | Same. |
| **code-documentation** | Inline docs for Coolify, connectivity, deployment spec. | Same + full-stack runbook and env comments. |
| **design** / **frontend-design** | Launch UI, template cards, App Generator. | Same; full-stack template card warning/tooltip. |

### 4.4 Commands (`.cursor/commands/`)

| Command | Assignment |
|---------|------------|
| **deploy** | Document Coolify Compose deploy for both agent-stack and (if applicable) full-stack; note volumes requirement for full-stack. |
| **code-review** | PRs that touch App Factory, Coolify, docker-compose, or temp/full-stack. |
| **pr** | App Factory and deployment changes. |
| **update-docs** | After changing deployment, env, or full-stack: refresh portal/docs, AGENT-TODO, FULL-STACK-RUNBOOK. |

### 4.5 Tools (MCP and project)

| Tool / source | Assignment |
|---------------|------------|
| **Context7** | Coolify API reference, GitHub REST API docs when adding or debugging connectivity/health or new API calls. |
| **Supabase MCP** | Development-only DB (app_factory tables, deployment_specs, template_registry, compose_stacks, tenants). Not for production data. |
| **GitHub MCP** | Commits, PRs, repo creation for App Factory–generated repos (if automated from agent). |
| **Fetch / FireCrawl** | Coolify or GitHub docs if Context7 is unavailable. |
| **Sequential Thinking** | Multi-step analysis when using deep-thinking for stack comparison or failure modes. |

---

## 5. Troubleshooting: "Docker Compose file not found at: /docker-compose.yaml"

Coolify looks for the Compose file by combining **Base Directory** and **Docker Compose Location**. The path and **extension must match exactly** (see Coolify docs via Context7: Docker Compose build pack).

- **Error:** `Docker Compose file not found at: /docker-compose.yaml` — Coolify’s default is root + `.yaml`. If your file is `docker-compose.yml` or in a subfolder, the lookup fails.

**App Factory–generated Compose apps (agent-stack):**  
The portal now sends `base_directory: "/"` and `docker_compose_location: "docker-compose.yml"` when creating the application via the API, so Coolify finds the file at repo root.

**Deploying the monorepo (this repo) as Compose:**  
The stack lives at `supabase-mt/docker-compose/docker-compose.yml`. In Coolify, when creating the resource from this repo, set:

- **Base Directory:** `supabase-mt/docker-compose` (or `/supabase-mt/docker-compose` if Coolify expects a leading slash).
- **Docker Compose Location:** `docker-compose.yml`.

Alternatively, add a root `docker-compose.yaml` in the repo that includes the stack, e.g. `include: supabase-mt/docker-compose/docker-compose.yml` (Compose v2.20+).

**Context7:** Use the Coolify docs library (`/coollabsio/documentation-coolify` or `/websites/coolify_io_api-reference`) to confirm current parameter names (`base_directory`, `docker_compose_location`) and behaviour.

---

## 6. References

- [BACKOFFICE-COOLIFY.md](./BACKOFFICE-COOLIFY.md) — Coolify env, API proxy, App Factory default env.
- [APP-FACTORY-DEPLOYMENT-SPEC.md](./APP-FACTORY-DEPLOYMENT-SPEC.md) — Deployment spec schema and template manifest.
- [APP-FACTORY-COOLIFY-DOMAINS.md](./APP-FACTORY-COOLIFY-DOMAINS.md) — Domains and force_domain_override.
- [FULL-STACK-RUNBOOK.md](./FULL-STACK-RUNBOOK.md) — Full-stack setup, volumes, env, and Coolify caveats.
- [AGENT-TODO.md](../../AGENT-TODO.md) — Env matrix and credential workflow.
- [docker-compose/README](../../docker-compose/README.md) — Local run and profiles (if present).
- [temp/full-stack/README.md](../../temp/full-stack/README.md) — Full-stack compose overview and prerequisite.
- Coolify API: use Context7 or [Coolify API reference](https://coolify.io/docs/api-reference/api) for latest endpoints.
