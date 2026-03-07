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
  Per-tenant or per-project Next.js apps (e.g. from `platforms` or `nextjs-mt-starter` template). Already deployed via Coolify today: generator pushes to GitHub, Coolify creates application from repo and deploys (Nixpacks or Compose depending on template).

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

3. **Generated apps (frontend / per-tenant)**  
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

---

## 4. Cursor: Agents, Tools, Commands, Rules, Skills (App Factory & Deployment)

### 4.1 Agents (`.cursor/agents/`)

| Agent | Assignment |
|-------|------------|
| **code-mnky** | Implementation of App Factory pipeline, Coolify API usage, deployment scripts, and DevOps flows. Use for build/deploy, code completions, and step-by-step deployment guidance. |
| **sage-mnky** | Architecture and deployment strategy (e.g. Compose vs Nixpacks, env strategy, security). Use when deciding how Coolify should own server vs frontend. |
| **docs** | Keeping BACKOFFICE-COOLIFY.md, APP-FACTORY-DEPLOYMENT-SPEC.md, this DEPLOYMENT-PLAN-COOLIFY.md, and AGENT-TODO env matrix in sync. |
| **discord-agent** | Only if App Factory or deployment status is exposed in Discord (e.g. notifications); otherwise not required. |
| **shopify** | Not for App Factory/Coolify; use for theme/LABZ/storefront only. |

### 4.2 Tools (MCP and project)

| Tool / source | Assignment |
|---------------|------------|
| **Context7** | Coolify API reference, GitHub REST API docs when adding or debugging connectivity/health or new API calls. |
| **Supabase MCP** | Development-only DB (app_factory tables, deployment_specs, template_registry). Not for production data. |
| **GitHub MCP** | Commits, PRs, repo creation for App Factory–generated repos (if automated from agent). |
| **Fetch / FireCrawl** | Coolify or GitHub docs if Context7 is unavailable. |
| **Sequential Thinking** | Multi-step analysis of deployment flow, failure modes, or env dependency when using deep-thinking. |

### 4.3 Commands (`.cursor/commands/`)

| Command | Assignment |
|---------|------------|
| **deploy** | Run deploy flow for portal or stack; document Coolify Compose deploy and Portal deploy steps in command or linked doc. |
| **code-review** | PRs that touch App Factory (launch, coolify, github, connectivity) or docker-compose. |
| **pr** | Creating PRs for App Factory and deployment changes. |
| **update-docs** | After changing deployment or env, refresh portal/docs and AGENT-TODO. |
| **security-audit** | When adding new credentials or proxy routes (e.g. connectivity or Coolify proxy). |

### 4.4 Rules (`.cursor/rules/`)

| Rule | Assignment |
|------|------------|
| **project-and-standards.mdc** | No new tech without approval; reuse existing patterns (e.g. connectivity via existing env helpers). |
| **mcp-tool-usage.mdc** | Prefer Context7 for API docs; use Fetch/FireCrawl when needed. |
| **database-rules.mdc** | Supabase for dev only; no destructive changes without confirmation. |
| **deep-thinking.mdc** | Use for deep research on deployment strategy, Coolify capabilities, or Docker Compose production patterns when requested. |
| **code-mnky.mdc** | Applied when CODE MNKY agent is used for implementation. |
| **create-migration.mdc** / **create-rls-policies.mdc** | When changing app_factory or backoffice-related schema. |

### 4.5 Skills (`.cursor/skills/`)

| Skill | Assignment |
|-------|------------|
| **design** | App Factory launch UI, template cards, and any new dashboard components; align with DESIGN-SYSTEM.md and main-glass. |
| **frontend-design** | Launch page and App Generator UI; avoid generic AI aesthetics. |
| **backend-development** | Coolify client, GitHub client, server actions, and API route design for connectivity/health. |
| **database-design** | deployment_specs, template_registry, app_factory audit tables. |
| **code-documentation** | Inline docs for connectivity, Coolify, and deployment spec. |
| **devops** (if present) | Docker Compose and Coolify resource design; not all projects have a dedicated DevOps skill. |

---

## 5. References

- [BACKOFFICE-COOLIFY.md](./BACKOFFICE-COOLIFY.md) — Coolify env, API proxy, App Factory default env.
- [APP-FACTORY-DEPLOYMENT-SPEC.md](./APP-FACTORY-DEPLOYMENT-SPEC.md) — Deployment spec schema and template manifest.
- [APP-FACTORY-COOLIFY-DOMAINS.md](./APP-FACTORY-COOLIFY-DOMAINS.md) — Domains and force_domain_override.
- [AGENT-TODO.md](../../AGENT-TODO.md) — Env matrix and credential workflow.
- [docker-compose/README](../../docker-compose/README.md) — Local run and profiles (if present).
- Coolify API: use Context7 or [Coolify API reference](https://coolify.io/docs/api-reference/api) for latest endpoints.
