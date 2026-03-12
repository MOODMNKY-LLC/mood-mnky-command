# Portal & Stack Infra — Agent, Command, Skill, and Rule Assignments

This document summarizes how **agents**, **commands**, **skills**, and **rules** are assigned to the MOOD MNKY Portal (supabase-mt/portal), Docker Compose stack (supabase-mt/docker-compose), and Ansible provisioning (supabase-mt/provisioning). Use it to route work consistently (e.g. use **code-mnky** for backend, **docs** for READMEs, **verifier** after changes).

See also [AGENT:TODO](../AGENT-TODO.md) for outstanding todos and env vars.

---

## Agents

| Agent | Portal / infra assignment |
|-------|----------------------------|
| **code-mnky** | Portal backend (API routes, backoffice-proxy, Supabase server), Docker Compose and Ansible playbooks, env and deploy scripts. |
| **docs** | Portal and infra docs: BACKOFFICE-FLOWISE-N8N.md, docker-compose/README.md, provisioning/README.md, CHATGPT-MOODMNKY-PORTAL-INFRA.md, AGENT-TODO.md, ENV and onboarding docs. |
| **mood-mnky** | Portal UI copy, product narrative, offerings, dashboard and back office UX tone. |
| **sage-mnky** | Architecture and trade-offs: when to add Coolify, AI gateway vs proxy-only, multi-zone Proxmox, tenant isolation. |
| **debugger** | Flowise/n8n/MinIO/Nextcloud proxy errors, Ansible playbook failures, env loading bugs. |
| **verifier** | After changes: back office flows, proxy auth, stack deploy, env defaults and instance resolution. |
| **discord-agent** | Only if Portal or stack integrates with Discord (e.g. notifications, bot config); otherwise not assigned to portal-infra. |
| **labz**, **verse-storefront**, **shopify** | Not assigned to Portal infra (separate app domains). |

---

## Commands

| Command | Portal / infra use |
|---------|--------------------|
| **/code-review** | PRs touching portal API, proxy, compose, or Ansible. |
| **/deploy** | Portal deploy and stack/provisioning runbooks. |
| **/pr** | PRs that affect portal, docker-compose, or provisioning. |
| **/security-audit** | Env handling, proxy auth, RLS, and secrets in portal and compose. |
| **/update-docs** | After changing env vars, API routes, or runbooks; keep AGENT-TODO.md and READMEs in sync. |
| **/reflect** | Retro on portal v1.5 scope and next priorities (Coolify, AI gateway). |
| **/brand-tone**, **/theme-research** | Use with mood-mnky for portal UX and theme. |
| **/discord-plan**, **/discord-refresh-map** | Not for portal-infra unless Discord is integrated. |

---

## Skills

| Skill | Portal / infra assignment |
|-------|---------------------------|
| **backend-development** | API design, proxy, Supabase server APIs, RLS. |
| **database-design** | tenant_app_instances, tenant_stack_subscriptions, migrations. |
| **design** / **frontend-design** | Portal UI, dashboard, back office panels, shadcn/theme. |
| **code-documentation** | Inline and external docs for proxy, instance resolution, env. |
| **code-review** | Back office and provisioning code. |
| **create-migration**, **create-rls-policies**, **create-db-functions** (rules) | Any new MT tables or RLS for portal. |
| **writing-supabase-edge-functions**, **use-realtime** | If portal adds Edge Functions or Realtime. |
| **deep-thinking** | Deep dives on infra decisions, multitenancy, and security. |
| **discord-agent** | Only if portal integrates Discord. |

---

## Rules

| Rule | When to use |
|------|-------------|
| **deep-thinking.mdc** | Deep research on portal-infra (e.g. Coolify, AI gateway, zones). |
| **create-migration.mdc**, **create-rls-policies.mdc**, **create-db-functions.mdc** | New migrations/RLS/functions for MT. |
| **postgres-sql-style-guide.mdc** | All SQL in migrations and RLS. |
| **writing-supabase-edge-functions.mdc**, **use-realtime.mdc** | Edge/Realtime work in portal. |
| **code-mnky.mdc**, **sage-mnky.mdc**, **mood-mnky.mdc** | Implementation, architecture, and copy. |
| **project-and-standards.mdc**, **mcp-tool-usage.mdc** | General standards and MCP usage. |
| **prd-creator.mdc** | If writing a PRD for v2 portal or stack. |

---

## Tools and MCPs

| Tool / MCP | Use |
|------------|-----|
| **Supabase local MCP** (supabase-local) | Inspect local MT schema, debug RLS, verify tenant_app_instances and tenant_stack_subscriptions. |
| **Supabase plugin** | Management API usage (if any) and MT data. |
| **Context7** | Supabase, Next.js, Flowise, n8n, MinIO, Ansible, Docker Compose, Proxmox VE API docs. |
| **Notion plugin** | MOOD MNKY credentials database: find, store, retrieve, copy secrets to/from .env.local and other env files (see AGENT-TODO.md). |
| **Filesystem MCP** | Safe read of env examples and compose files; do not write secrets. |

---

## Workstream-specific assignments

Use these when working on the following areas:

### Dashboard refactor (platform-admin-only, org switcher, tenant sections)

- **Agents**: code-mnky (routing, layout, redirects, data loading), mood-mnky (copy and UX for “MOOD MNKY org-level admin” and tenant dashboard).
- **Skills**: backend-development (API/data patterns), design / frontend-design (dashboard and tenant dashboard UI).
- **Rules**: create-migration.mdc only if new RLS or tables are added; otherwise no DB changes.

### Tenant dynamic routing (`/t/[slug]`, `/t/[slug]/dashboard`)

- **Agents**: code-mnky (Next.js App Router, layout, membership check).
- **Skills**: backend-development (routing, auth, data scoping).
- **Tools**: Supabase local MCP and Supabase plugin to verify RLS and tenant-scoped queries.

### Proxmox dedicated pages (cluster, nodes, vms, storage)

- **Agents**: code-mnky (routes, layout, data fetching).
- **Skills**: frontend-design (responsive layouts, tables/cards).
- **Tools**: Context7 for Proxmox VE API documentation when adding or changing endpoints.

### Deep research / architecture (multi-tenant routing, redirect strategy)

- **Rules**: deep-thinking.mdc for multi-tenant routing and redirect strategy.
- **Agents**: sage-mnky for trade-offs (e.g. path-based vs subdomain, tenant layout structure).

---

## App Factory (Portal V2)

Assignments for the App Factory: customer/project intake, template registry, deployment spec, generator, Coolify deploy, GitHub repo creation, job orchestration.

### Agents

| Agent | App Factory assignment |
|-------|------------------------|
| **code-mnky** | Launch Wizard (Server Actions, API routes), deployment spec validation (Zod), generator package, Coolify API integration (create app, deploy, status), GitHub repo creation, job orchestration and status tracking. |
| **docs** | Template manifest spec, deployment spec JSON schema, BACKOFFICE-COOLIFY.md updates (create/deploy flows), AGENT-TODO.md and env matrix. |
| **mood-mnky** | Launch Wizard copy, Customers/Projects/Templates UX tone, branding and handoff narrative. |
| **sage-mnky** | Architecture: customer vs tenant mapping, shared vs dedicated Supabase strategy, when to add Terraform/Ansible to the launch path. |
| **debugger** | Generator failures, Coolify API errors, GitHub push failures, job state machine bugs. |
| **verifier** | After each milestone: spec validation, generation output, Coolify deploy flow, health checks. |

### Commands

| Command | App Factory use |
|---------|-----------------|
| **/code-review** | PRs that add or change generator, Coolify integration, migrations for app factory tables. |
| **/security-audit** | Deployment spec handling, secret references, GitHub token and Coolify key usage. |
| **/update-docs** | When adding env vars (e.g. GITHUB_TOKEN), new API routes, or template manifest format. |
| **/reflect** | After MVP: prioritization of Phase 2 (Terraform, Ansible, multiple templates). |

### Skills

| Skill | App Factory assignment |
|-------|------------------------|
| **backend-development** | API design for Coolify create/deploy, GitHub repo creation, job queue or polling. |
| **database-design** | customers, projects, template_registry, template_versions, deployment_specs, provisioning_jobs, deployment_targets, project_environments, secret_references, releases; RLS for platform_admin vs tenant-scoped. |
| **design** / **frontend-design** | Launch Wizard steps, Customers/Projects/Templates lists, Deployment Timeline and Environment View. |
| **code-documentation** | Template manifest format, deployment spec schema, generator README. |
| **llm-application-dev** | Optional: AI-assisted intake-to-spec (Phase 3); not MVP. |

### Rules

| Rule | When to use |
|------|-------------|
| **deep-thinking.mdc** | Deep dives on customer–tenant model, deployment models (shared vs dedicated), and security (secrets, RLS for new tables). |
| **create-migration.mdc** | All new app factory tables and indexes. |
| **create-rls-policies.mdc** | RLS for customers, projects, deployment_specs, provisioning_jobs, template_registry, etc. |
| **postgres-sql-style-guide.mdc** | All SQL in migrations. |
| **create-db-functions.mdc** | Any helper functions (e.g. job status transitions, spec validation triggers) if needed. |

### Tools and MCPs

| Tool / MCP | App Factory use |
|------------|-----------------|
| **Supabase local MCP** | Inspect and align local schema: list_tables, execute_sql for migrations and RLS verification. |
| **Supabase plugin** | Production DB state: list_projects, list_tables(project_id), execute_sql. Use SUPABASE_MT_PROJECT_REF as project_id. |
| **Context7** | Up-to-date docs: resolve-library-id then query-docs for Supabase (SSR, RLS), Next.js (App Router, Server Actions, env vars), Coolify (API reference). |
| **OpenAI Developer Docs MCP** | When enhancing or debugging the existing AI SQL feature (/api/ai/sql); optional for App Factory MVP. |
| **Notion** | MOOD MNKY credentials database: store/retrieve GITHUB_TOKEN, Coolify keys; keep AGENT-TODO and .env.local in sync. |
