---
title: Dev Notes
type: shared-document
authors: [user, ai-agent]
purpose: Ever-growing reference for developing mood-mnky-command — shortcuts, tools, tips, and Cursor configuration.
updated: 2026-02-20
---

# Dev Notes

A shared document between you and your AI development partner. Add shortcuts, tools, tips, and project-specific knowledge as you go.

## Quick Start

### Run apps/web (Next.js app)

From repo root:

```bash
pnpm dev
```

App runs at `http://localhost:3000`. Key routes: MNKY VERSE `/verse`, `/verse/blog`, `/verse/community`; Dojo `/dojo`; LABZ dashboard `/`.

### Environment Variables

Env files live at **monorepo root**. `pnpm dev` and `pnpm build` load `.env.local` and `.env` via dotenv-cli.

- `.env.local` — Local dev overrides (Supabase local, ngrok). Loaded first.
- `.env` — Staging: vars to push to Vercel. Optional.
- `.env.production` — Vercel pull target. Not loaded by dev.

**Vercel workflow:**

```bash
# Pull production vars (never overwrites .env or .env.local)
vercel env pull .env.production --environment=production

# Push new vars: add to .env or .env.local, then run
pnpm --filter web vercel:env-sync

# Backup + pull + push vars missing in production
pnpm --filter web vercel:env-backup-pull-push
```

**Validate env before deploy:**

```bash
pnpm --filter web vercel:env-check
```

See [docs/VERCEL-ENV-SYNC.md](docs/VERCEL-ENV-SYNC.md) for the full checklist.

### Mintlify Docs (mnky-docs)

```bash
pnpm docs:dev
```

Docs run at `http://localhost:3333`. Validate with `pnpm docs:validate`.

---

## Cursor Agents (Subagents)

Invoke via the task tool (`mcp_task`) when you need specialized help.

- **shopify** — Theme templates, sections, app blocks, LABZ pages, menu updates, Storefront API. Touchpoints: `Shopify/theme/`, `extensions/mood-mnky-theme/`, Admin API.
- **debugger** — Runtime errors, build failures, flaky tests. Root cause analysis, minimal fix, verification.
- **labz** — Dashboard LABZ, Supabase-backed data (oils, notes, formulas), LABZ APIs, Blending Lab, glossary. Routes: `app/(dashboard)/`, `app/api/fragrance-*`, `app/api/formulas/`.
- **verifier** — Validate completed work. Run tests, build, key flows. Report what passed and what is incomplete. Use proactively after tasks.
- **verse-storefront** — Public Verse routes, iframes (fragrance wheel, blending guide), CSP, frame-ancestors, storefront-only features. No auth gates on storefront.
- **explore** — Fast codebase exploration. Use for broad searches, file patterns, "how does X work?".
- **generalPurpose** — Research, multi-step tasks, keyword/search across repo.
- **shell** — Git, terminal commands, bash operations.

---

## Cursor Commands

Slash commands in chat. Add context after the command.

- `/deploy` — Deploy to Vercel: build, commit, push. Run guardrails first (branch, remote, staged changes, pull latest).
- `/pr` — Create a PR via GitHub CLI. Commit first if needed.
- `/code-review` — Checklist for PRs: functionality, quality, security. Add context, e.g. `/code-review this PR`.
- `/security-audit` — Dependency audit, code security review, infra/config. E.g. `/security-audit before release`.
- `/theme-research` — Deep research for theme decisions (migration, performance, architecture). Uses deep-thinking protocol.

---

## Cursor Skills

Read via the skills system; invoke when relevant.

- **design** — UI/UX, components, design system, shadcn, Magic UI. Align with `docs/DESIGN-SYSTEM.md`.
- **docs-lookup** — Fetch current docs, API refs, library examples. Uses Context7, Fetch, FireCrawl.
- **research** — Deep Research Protocol: multi-source, verified research with narrative report. Use `/research` or explicit "research X" / "deep dive".

---

## Cursor Rules

### Always Applied

- **project-and-standards.mdc** — Repo identity (mood-mnky-command), tech stack, coding standards. Consult README and docs/. Do not modify working code/UI without instruction.
- **database-rules.mdc** — Supabase MCP for dev only. No destructive data changes without confirmation.
- **mcp-tool-usage.mdc** — When to use Brave, Tavily, FireCrawl, Sequential Thinking, Notion, GitHub, etc.

### Agent-Requestable (read when needed)

- **writing-supabase-edge-functions.mdc** — Supabase Edge Functions coding rules
- **use-realtime.mdc** — Supabase Realtime usage
- **prd-creator.mdc** — When creating a PRD
- **postgres-sql-style-guide.mdc** — Postgres SQL guidelines
- **create-rls-policies.mdc** — Row Level Security policies
- **create-migration.mdc** — Postgres migrations
- **create-db-functions.mdc** — Supabase database functions
- **deep-thinking.mdc** — Deep research protocol (stop points, themes, cycles, final report)

### Theme / Shopify

- **shopify-liquid-basics.mdc** — Liquid fundamentals and safe editing
- **section-schema-safety.mdc** — Prevent breaking section schema and theme editor
- **assets-css-js-standards.mdc** — Theme assets without regressions
- **performance-accessibility.mdc** — Storefront UX guardrails

---

## MCP Servers

Configured in `.cursor/mcp.json`. Key servers:

- **moodmnky-docs** — SearchMoodMnky: MOOD MNKY knowledge base, code examples, API refs.
- **supabase-local** — Local Supabase MCP at `http://127.0.0.1:54321/mcp` for local DB.
- **shadcn** — shadcn/ui components: add, customize.
- **@magicuidesign/mcp** — Magic UI: animated components, design-system work.
- **openaiDeveloperDocs** — OpenAI developer documentation.
- **filesystem** — Docker-based filesystem access (mounted at C:/DEV-MNKY).
- **n8n-dev-mcp** — n8n workflow integration.

**Example servers** (in `mcp.json.example`, not always enabled): Brave Search, Tavily, FireCrawl, Fetch, Sequential Thinking, GitHub, Notion, Shopify Dev MCP.

**Keys needed**: `BRAVE_API_KEY`, `TAVILY_API_KEY`, `FIRECRAWL_API_KEY`, `GITHUB_PERSONAL_ACCESS_TOKEN`, `NOTION_API_KEY` (for Notion open-source variant). OAuth used for Notion Hosted.

---

## Shopify Environment

Shopify vars live at monorepo root. `Shopify/.env` is separate (Shopify CLI scope: theme push, theme dev).

**Admin API:** `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_API_TOKEN`, `SHOPIFY_API_SECRET` — used by LABZ pages, products, metaobject sync, theme templates.

**Storefront API (MNKY VERSE):** `NEXT_PUBLIC_STORE_DOMAIN`, `PUBLIC_STORE_DOMAIN`, `NEXT_PUBLIC_STOREFRONT_API_TOKEN`, `PUBLIC_STOREFRONT_API_TOKEN`, `PRIVATE_STOREFRONT_API_TOKEN`, `NEXT_PUBLIC_STOREFRONT_ID`, `PUBLIC_STOREFRONT_ID` — from Hydrogen channel.

**Customer Account API:** `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID`, `PUBLIC_CUSTOMER_ACCOUNT_API_URL`, `SHOP_ID` — for Login with Shopify on `/verse`. Optional explicit URLs: `PUBLIC_CUSTOMER_ACCOUNT_API_AUTHORIZE_URL`, `_TOKEN_URL`, `_LOGOUT_URL`.

**App integration:** `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` (Admin links), `MOODMNKY_API_KEY` (Bearer for Flowise, metaobject sync, notion sync). Optional: `APP_PROXY_JWT_SECRET`, `SHOPIFY_WEBHOOK_SECRET`.

Full reference: [docs/SHOPIFY-ENV-REFERENCE.md](docs/SHOPIFY-ENV-REFERENCE.md). Customer Account setup: [docs/HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md](docs/HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md). Tokens: Notion Credentials (MOOD MNKY Credentials), Hydrogen → Environments and variables.

---

## Tips and Shortcuts

1. **Supabase local**: Run `supabase start` from repo root. Dashboard at `http://127.0.0.1:54323`.
2. **ngrok for Shopify OAuth**: Customer Account API needs HTTPS. Use `pnpm --filter web dev:tunnel` and set `NGROK_DOMAIN` in `.env.local`. Sync URL: `pnpm --filter web ngrok:sync-url`.
3. **Theme push**: `shopify theme push --path Shopify/theme` from root. Use Shopify CLI for dev/preview.
4. **Docs validation**: Fix Mintlify frontmatter errors (e.g. description with apostrophes) before `docs:dev` will succeed.
5. **Env from project root**: Scripts that use `process.cwd()` expect to run from the package dir (e.g. apps/web). Vercel env scripts resolve paths from cwd; run from root with `pnpm --filter web <script>` for correct behavior.

---

## Adding to This Document

Append new tips, shortcuts, or tool notes as you discover them. Keep sections loosely organized; this is a living reference.
