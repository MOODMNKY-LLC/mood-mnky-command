# Companion & Manga Engine Roadmap

This document summarizes the roadmap for the **MNKY VERSE Companion** and **Collection Manga / Magazine** engine. It extends the main [README](../README.md) roadmap and aligns with [temp/MNKY-COMPANION-MANGA-ENGINE-STARTER.md](../temp/MNKY-COMPANION-MANGA-ENGINE-STARTER.md) (Riftbound narrative, metaobjects, Flowise tools, Notion sync).

---

## References (start here)

| Doc | Purpose |
|-----|---------|
| [PRD-Collection-Manga-Magazine.md](PRD-Collection-Manga-Magazine.md) | Manga schema, reader, backoffice, telemetry, XP |
| [PRD-Gamification-MNKY-VERSE.md](PRD-Gamification-MNKY-VERSE.md) | XP, quests, rewards, UGC, Discord, Shopify webhooks |
| [MAG-XP-RULES.md](MAG-XP-RULES.md) | config_xp_rules keys (mag_read, mag_quiz, mag_download, purchase, ugc_approved) |
| [DOJO-SECTION.md](DOJO-SECTION.md) | Dojo routes, XP/quests/manga cards, Flowise Blending Lab |
| [FLOWISE-FRAGRANCE-CRAFTING.md](FLOWISE-FRAGRANCE-CRAFTING.md) | Flowise embed env (NEXT_PUBLIC_FLOWISE_*), Dojo chat |
| [SHOPIFY-INTEGRATION-ROADMAP.md](SHOPIFY-INTEGRATION-ROADMAP.md) | Verse/LABZ Shopify APIs, phased initiatives |
| [VERSE-STOREFRONT-STACK.md](VERSE-STOREFRONT-STACK.md) | Next.js + Hydrogen React, Storefront API |
| [SHOPIFY-METAOBJECTS-SYNC.md](SHOPIFY-METAOBJECTS-SYNC.md) | Pattern for Supabase → Shopify metaobject sync (fragrance_notes) |
| [MNKY-VERSE-APP-PROXY-SETUP.md](MNKY-VERSE-APP-PROXY-SETUP.md) | App Proxy, session, api/issues, api/quests, metaobject publish plan |

**Implementers:** For up-to-date API and schema details, use **Context7 MCP** (Cursor plugin for library docs) and **Shopify Dev MCP** (see `.cursor/mcp.json.example` — `shopify-dev-mcp`) for Flowise, Shopify Admin/Storefront API, and metaobject definitions.

---

## Getting started — implementation order

Use this order to start using the Companion & Manga pieces that are already built.

1. **Env and migrations**
   - Ensure `.env` / `.env.local` have Flowise vars (`FLOWISE_BASE_URL`, `FLOWISE_API_KEY`, `NEXT_PUBLIC_FLOWISE_HOST`, `NEXT_PUBLIC_FLOWISE_CHATFLOW_ID`) and Shopify Admin vars (`SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_API_TOKEN` with metaobject scopes). See `.env.example`.
   - Run the manga metaobject columns migration: `supabase db push` (or apply `20260303100000_manga_shopify_metaobject_columns.sql`) so `mnky_collections` and `mnky_issues` have `shopify_metaobject_id` and `shopify_synced_at`.

2. **Publish to Shopify (Phase 2)**
   - Call `POST /api/shopify/sync/metaobject-manga` with `Authorization: Bearer <MOODMNKY_API_KEY>` (or as an authenticated admin). Optional: `?issueSlug=...` or `?issueId=...` to publish one issue. The route ensures `mnky_collection` and `mnky_issue` metaobject definitions in Shopify, then syncs published issues and their collections. Add a “Publish to Shopify” button in Verse Backoffice → Manga that POSTs to this endpoint (e.g. from the issue list or issue detail page).

3. **Flowise tools (Phase 3)**
   - In Flowise, add **Custom Tool** nodes that call your app with `MOODMNKY_API_KEY`. See **Calling app tools from Flowise (Manga)** below.
   - Author Riftbound (or any issue) in Notion (MNKY Manga Collections + Issues), then run Notion sync: `POST /api/notion/sync/manga` (admin or `MOODMNKY_API_KEY`). See [RIFTBOUND-NARRATIVE-GUIDANCE.md](RIFTBOUND-NARRATIVE-GUIDANCE.md).

4. **Dojo and theme (Phase 4)**
   - Dojo already shows manga issues; optionally add a “Current issue” or featured-issue link in [lib/dojo-sidebar-config.tsx](../lib/dojo-sidebar-config.tsx) or the Dojo home lower section (see [DOJO-SECTION.md](DOJO-SECTION.md)).
   - Optionally add a theme block or section that fetches “current issue” from App Proxy `GET /apps/mnky/api/issues` or from Shopify metaobjects (see [SHOPIFY-MANGA-METAOBJECTS.md](SHOPIFY-MANGA-METAOBJECTS.md)).

5. **Optional MCPs**
   - Add **Shopify Dev MCP** from `.cursor/mcp.json.example` to `.cursor/mcp.json` for Admin/Storefront API and metaobject docs when implementing theme or API changes.
   - Use **Context7** (Cursor plugin) for up-to-date Flowise, AI SDK, or Shopify docs.

---

## Calling app tools from Flowise (Manga)

Flowise Custom Tool nodes should POST to the app with **Bearer auth** and JSON body. Use the same key as `MOODMNKY_API_KEY` in Flowise (e.g. as a Runtime variable `moodMnkyApiKey`). Base URL: your app root (e.g. `https://mnky-command.moodmnky.com` or `NEXT_PUBLIC_APP_URL`).

| Tool | URL | Method | Body | Notes |
|------|-----|--------|------|--------|
| **Hotspot mapper** | `{baseUrl}/api/flowise/tools/manga/hotspot-mapper` | POST | `{ "issueSlug": "your-issue-slug" }` (optional `chapterOrder`) | Returns context for LLM to suggest hotspots. |
| **Quiz generator** | `{baseUrl}/api/flowise/tools/manga/quiz-generator` | POST | `{ "issueSlug": "your-issue-slug" }` | Returns context and `output_schema` for LLM to generate quiz questions. |

**Headers:** `Content-Type: application/json`, `Authorization: Bearer <MOODMNKY_API_KEY>`. See [FLOWISE-FRAGRANCE-CRAFTING.md](FLOWISE-FRAGRANCE-CRAFTING.md) for the same pattern used by other Custom Tools.

---

## Notion ↔ Supabase manga sync (mapping)

The Notion sync route `app/api/notion/sync/manga/route.ts` maps:

- **Collections:** Notion DB `NOTION_MNKY_COLLECTIONS_DATABASE_ID` → `mnky_collections` (Name/Title → name, Slug → slug). Required.
- **Issues:** Notion DB `NOTION_MNKY_ISSUES_DATABASE_ID` → `mnky_issues` (Title, Slug, Issue Number, Status, Arc Summary, Cover URL, Published Date, relation to Collection). Required.
- **Chapters:** `NOTION_MNKY_CHAPTERS_DATABASE_ID` → `mnky_chapters` (Issue relation, Fragrance Name, Shopify Product GID, Setting, Chapter Order). Optional; sync runs only when this env is set.
- **Panels:** `NOTION_MNKY_PANELS_DATABASE_ID` → `mnky_panels` (Chapter relation, Panel Number, Script Text, Asset Prompt, Asset URL). Optional.
- **Hotspots:** `NOTION_MNKY_HOTSPOTS_DATABASE_ID` → `mnky_hotspots`. Optional.

Env gaps: set `NOTION_MNKY_CHAPTERS_DATABASE_ID`, `NOTION_MNKY_PANELS_DATABASE_ID`, and `NOTION_MNKY_HOTSPOTS_DATABASE_ID` in `.env` when you have the corresponding Notion databases to sync chapters, panels, and hotspots.

---

## Current state (what exists)

- **Manga engine:** Supabase `mnky_collections`, `mnky_issues`, `mnky_chapters`, `mnky_panels`, `mnky_hotspots` with RLS. Public reader: `app/(storefront)/verse/issues/`, `verse/issues/[slug]/chapters/[n]`. Backoffice: `app/(dashboard)/verse-backoffice/manga/`. Notion sync: `app/api/notion/sync/manga/route.ts`. APIs: `app/api/mag/issues/`, read-event, quiz, download.
- **Gamification:** XP ledger/state, quests, `config_xp_rules`, Inngest (order.paid, quest/evaluate, mag/ugc). Dojo home surfaces XP, quests, `mnky_issues`, and Flowise Blending Lab.
- **Flowise:** `lib/flowise/client.ts`, Dojo embed (`NEXT_PUBLIC_FLOWISE_HOST`, `NEXT_PUBLIC_FLOWISE_CHATFLOW_ID`), Platform panel, tools: `get-issue-context`, `resolve-product`, `xp/propose-award`. See [temp/flowise-api-upgraded.json](../temp/flowise-api-upgraded.json) for chatflows, execute, credentials, deployments.
- **Shopify:** Storefront API + Hydrogen React, Customer Account API, App Proxy (`/apps/mnky/session`, `api/issues`, `api/quests`), Issue Teaser theme block, fragrance_notes metaobject sync.

---

## Phased roadmap

### Phase 1 — Environment and docs (done)

- **Env:** `.env.example` includes `FLOWISE_BASE_URL`, `FLOWISE_API_KEY`, `NEXT_PUBLIC_FLOWISE_HOST`, `NEXT_PUBLIC_FLOWISE_CHATFLOW_ID`, optional `FLOWISE_KEY_ENCRYPTION_SECRET` (see FLOWISE-FRAGRANCE-CRAFTING, VERCEL-ENV-SYNC).
- **Docs:** This file; optional Context7/Shopify Dev MCP noted in `.cursor/mcp.json.example`.

### Phase 2 — Shopify metaobject schema and publish pipeline

- **Metaobject definitions:** Define in Shopify Admin (or via Admin API) types: `mnky_collection`, `mnky_issue`, `mnky_chapter`, `mnky_panel`, `mnky_hotspot` per starter doc (name, slug, refs, script_text, asset_url, hotspots, type, shopify_gid, x, y, label, tooltip, etc.).
- **Publish pipeline:** Verse Backoffice “Publish to Shopify” action: read from Supabase (issues + chapters/panels/hotspots/collections), write/update Shopify metaobjects via Admin API; optionally add `shopify_metaobject_id` / `synced_at` columns (migration + RLS). Endpoint protected by admin auth and/or `MOODMNKY_API_KEY`. See MNKY-VERSE-APP-PROXY-SETUP and SHOPIFY-METAOBJECTS-SYNC for patterns.
- **Theme/Storefront:** Use metaobjects for “current issue” or collection in Liquid or Storefront API; Verse reader remains Supabase-backed.

### Phase 3 — Flowise tools and Riftbound content

- **Flowise tools:** Implement **hotspot mapper** and **quiz generator** under `app/api/flowise/tools/manga/` (e.g. `hotspot-mapper`, `quiz-generator`), secured with `requireInternalApiKey`; Zod-validated input/output; callable from Flowise chatflows.
- **Riftbound narrative:** Author in Notion (MNKY Manga Collections + Issues), sync via existing Notion sync API. Add collection/product copy and full issue storyboard outline (arc summary, chapter outlines, panel prompts, hotspots, glitch cuts, machine interludes, quiz/download ideas) per starter doc; store in Notion or repo docs.

### Phase 4 — Dojo and Verse UX alignment

- **Dojo:** Keep manga issues, quests, XP, Blending Lab; add quick links to Riftbound or “Current issue” when available. See [DOJO-SECTION.md](DOJO-SECTION.md) (Companion & Manga). Follow [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).
- **Verse reader:** Panel layout, hotspot overlays, telemetry (read/quiz/download) and XP/quest wiring per [PRD-Collection-Manga-Magazine](PRD-Collection-Manga-Magazine.md). Public routes under `app/(storefront)/verse/issues/`; **verse-storefront** agent for CSP/embed safety.
- **Theme:** Optional block/section for “Current issue” or Riftbound using Shopify metaobjects ([SHOPIFY-MANGA-METAOBJECTS.md](SHOPIFY-MANGA-METAOBJECTS.md)) or App Proxy `GET /apps/mnky/api/issues`. Existing **MNKY VERSE Issue Teaser** block links to `/verse/issues`; extend or add a block that consumes metaobject/list from proxy.

### Phase 5 — Optimization and upgrades

- **Flowise:** Use “execute chatflow” from backoffice or Inngest for batch runs; per-user API keys (`FLOWISE_KEY_ENCRYPTION_SECRET`) for Dojo chat where applicable.
- **Rate limiting:** Upstash Redis on mag read-event, quiz, UGC presign per [PRD-Collection-Manga-Magazine](PRD-Collection-Manga-Magazine.md) and [PRD-Gamification-MNKY-VERSE](PRD-Gamification-MNKY-VERSE.md); Flowise tool endpoints are protected by `MOODMNKY_API_KEY` only (no per-user rate limit).
- **Realtime:** Supabase Realtime for backoffice sync status if needed (see [use-realtime.mdc](../.cursor/rules/use-realtime.mdc)).
- **AI SDK / storefront agents:** Optional future Verse AI agent (Vercel AI SDK, Context7); not required for current Riftbound scope.
- **Future:** Discord role automation, reward redemption UI (PRD-Gamification).

---

## Cursor agents and skills

- **shopify:** Metaobject definitions, theme blocks, App Proxy, publish script.
- **verse-storefront:** Reader UI, Verse tokens, CSP/embed.
- **labz:** Backoffice manga/XP/quests, Notion sync UI, Flowise panel.
- **verifier:** Validate publish flow, XP/telemetry, tool endpoints.
- **debugger:** Inngest, Flowise, sync errors.
- **Design skill:** Dojo sections, reader panels, hotspot UI, Verse Backoffice; shadcn + Magic UI MCPs, DESIGN-SYSTEM.md.
- **Deep research:** Use `.cursor/rules/deep-thinking.mdc` only when explicitly asked for deep research (e.g. Storefront MCP vs Admin API for manga).

---

## Data flow (high level)

- **Authoring:** Notion (MNKY Manga Issues/Collections) → Notion Sync API → Supabase manga tables.
- **Backoffice:** Manga UI and “Publish to Shopify” read from Supabase, write to Shopify metaobjects via Admin API.
- **Verse:** Reader and Dojo read from Supabase; Dojo embeds Flowise Blending Lab.
- **Flowise:** Chatflows call app tools (get-issue-context, resolve-product, hotspot-mapper, quiz-generator); tools read Supabase and optionally Shopify.
