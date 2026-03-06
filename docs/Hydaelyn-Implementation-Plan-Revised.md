# Hydaelyn Implementation Plan (Revised)

Revised plan after deep analysis of the PDF *ACT Supabase Next.js Overlay Ideas*, verification against local Supabase, and alignment with the requirement: **new Next.js TypeScript app in apps/hydaelyn** using pnpm, Supabase SSR, Supabase JS, shadcn, and Tailwind CSS.

---

## 1. PDF Analysis and Veracity

### 1.1 Summary of the PDF

The PDF describes a **Hydaelyn platform**: an integrated FFXIV raid companion that connects ACT (OverlayPlugin or custom plugin), Supabase (Postgres + Realtime, RLS), and a **Next.js app (codename Hydaelyn)** in the MOOD MNKY monorepo. It specifies:

- **Data capture:** OverlayPlugin WebSocket (e.g. ws://127.0.0.1:10501/ws) → **local companion service** (Node.js/TypeScript) normalizes events → writes to Supabase. Optional C# ACT plugin for advanced features. Optional ODBC with sanitized zero-dates.
- **Schema:** “Create a new schema hydaelyn” with tables such as **encounters** (id, report_id, start_time, end_time, zone, boss, party_composition, created_by) and **combat_events** (id, encounter_id, timestamp, type, source, target, ability_id, damage, metadata JSONB). Supabase Realtime on these for live updates.
- **App:** **apps/hydaelyn**, App Router, “@supabase/auth-helpers-nextjs” (see correction below), Discord as primary auth, FFLogs OAuth optional, shadcn/Tailwind, dark theme, Realtime subscriptions.
- **Packages:** **packages/hydaelyn-sdk** with fflogs.ts, supabase.ts, discord.ts, ai.ts. pnpm-workspace and turbo.json updated.
- **Discord bot:** Slash commands (/mnky link, pull-status, recap, plan, timeline); Edge Functions or serverless triggered by Realtime.
- **Roadmap:** Phase 1 = companion + tables + RLS + app scaffold + minimal overlays + /mnky pull-status; Phase 2 = FFLogs sync + recaps; Phase 3 = mitigation/timeline; Phase 4 = team + AI; Phase 5 = monetization.

### 1.2 Verification Against Local Supabase

Queries were run against **local Supabase** (postgresql://postgres:postgres@127.0.0.1:54500/postgres):

- **Schemas:** No **hydaelyn** schema exists yet. Only standard and existing schemas (public, auth, realtime, etc.) are present.
- **Public schema tables:** **stream_sessions**, **pulls**, **overlay_config** already exist and match the Option B / PRD model:
  - **stream_sessions:** id, profile_id (FK profiles), name, overlay_token (unique), encounter_id, zone_id, started_at, ended_at, source (act_ingest | fflogs), created_at, updated_at; RLS for authenticated users on own rows.
  - **pulls:** id, stream_session_id (FK), pull_number, duration_sec, outcome (wipe | kill), dps_snapshot (jsonb), started_at, ended_at, created_at; RLS scoped to own session.
  - **overlay_config:** referenced by stream_sessions (stream_session_id FK); last_combat_data, last_updated_at for live overlay display.
- **ACT ODBC tables:** encounter_table, combatant_table, current_table, damagetype_table exist in public (from ACT ODBC export). They are separate from the stream_sessions/pulls ingest flow.

**Conclusion:** The PDF’s **hydaelyn** schema and **encounters** / **combat_events** tables are **not** present locally; they represent a richer, event-level model for a later phase. The **stream_sessions / pulls / overlay_config** model (Option B / PRD) is already in place and can be used by the new Hydaelyn app for overlay-based ingest and OBS overlay URLs.

### 1.3 Corrections and Alignment with Monorepo

- **Auth library:** The PDF references “@supabase/auth-helpers-nextjs”. The monorepo uses **@supabase/ssr** and **@supabase/supabase-js** (see apps/web, apps/mood-mnky, apps/code-mnky). Hydaelyn should use **@supabase/ssr** (createServerClient for server components and route handlers, cookie handling) and **@supabase/supabase-js**, not auth-helpers-nextjs.
- **App location:** The PDF and the user requirement both specify **apps/hydaelyn**. The copy-overlays script already targets **apps/hydaelyn/public/overlays/**; the app does not exist yet and must be scaffolded.
- **Workspace:** pnpm-workspace.yaml uses `apps/*` and `packages/*`, so adding **apps/hydaelyn** and **packages/hydaelyn-sdk** does not require workspace changes beyond adding the directories. **turbo.json** uses generic build/dev/lint tasks; adding hydaelyn is automatic once the app has a package.json with those scripts.

### 1.4 Production Database Verification

Supabase **production** was not queried in this pass (no Supabase MCP tool was invoked for prod). Before deploying Hydaelyn to production:

- Ensure the same migrations that create **stream_sessions**, **pulls**, **overlay_config** (and, if used, **hydaelyn** schema and **encounters** / **combat_events**) are applied to the linked production project (e.g. `supabase db push` or run migrations via Supabase dashboard/CLI).
- If production uses a different project, run the migration set there and confirm RLS and FKs; optionally use the Supabase plugin/MCP to list tables and verify schema if available.

---

## 2. First-Principles Scope for the New App

- **Hydaelyn** is a **new Next.js application** under **apps/hydaelyn**, not a set of routes inside apps/web.
- **Stack:** Next.js (App Router), TypeScript, pnpm, **@supabase/ssr**, **@supabase/supabase-js**, **shadcn/ui**, **Tailwind CSS**. Same Supabase client patterns as apps/web (createServerClient for SSR, createAdminClient for ingest with service role).
- **Data:** The app reads/writes **stream_sessions**, **pulls**, **overlay_config** in **public** (existing tables). Ingest API uses **service role** to resolve overlay_token and upsert overlay_config / insert pulls, bypassing RLS for the overlay-origin requests.
- **Overlays:** ACT overlay bundle (HTML/JS) POSTs CombatData to Hydaelyn’s ingest API. OBS overlay page is a route in the Hydaelyn app that polls (or subscribes via Realtime) to session stats. Overlay assets are copied from **resources/ffxiv/overlays/** to **apps/hydaelyn/public/overlays/** via the existing copy script once the app exists.
- **Optional (PDF) extensions for later phases:** Dedicated **hydaelyn** schema with **encounters** and **combat_events**; **local companion** (Node/TS) subscribing to OverlayPlugin WS and writing normalized events; **packages/hydaelyn-sdk**; Discord bot; FFLogs v2 and OpenAI. These are out of scope for the initial “Option B on our app” deliverable but are documented as roadmap.

---

## 3. Revised Implementation Plan

### 3.1 Scaffold the Hydaelyn App

- **Create** **apps/hydaelyn** with Next.js (App Router), TypeScript, pnpm.
- **Dependencies:** next, react, react-dom, @supabase/ssr, @supabase/supabase-js, tailwindcss, and shadcn/ui (align versions with apps/web or apps/mood-mnky). Add dev dependencies (dotenv-cli, eslint, typescript, etc.).
- **Structure:** Mirror apps/web or apps/mood-mnky: `app/`, `components/`, `lib/`. In `lib/`: `supabase/server.ts` (createServerClient via @supabase/ssr), `supabase/client.ts` (browser client), `supabase/admin.ts` (createAdminClient for ingest). Middleware for auth (optional) and cookie refresh per Supabase SSR docs.
- **Environment:** .env.local (or root .env) with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY. Use same Supabase project as web so stream_sessions/pulls/overlay_config are shared.
- **Config:** tsconfig.json rootDir apps/hydaelyn; next.config; tailwind + PostCSS; add shadcn components as needed.
- **Scripts:** dev, build, start, lint. Use dotenv -e ../../.env.local -e ../../.env for dev so root env is loaded.
- **Turbo:** No change required; turbo already runs build/dev/lint for all apps under apps/*.

### 3.2 Ingest API (ACT Overlay → Hydaelyn)

- **Route:** **apps/hydaelyn/app/api/ingest/combat/route.ts** (POST).
- **Body (Zod):** overlay_token (string), encounter (object: title, duration, ENCDPS, etc.), combatants (object), optional zone_id, optional outcome (wipe | kill).
- **Logic:** Resolve stream_session by overlay_token using **createAdminClient()**; if not found, return 401. Rate limit by overlay_token (e.g. in-memory or Upstash). Upsert **overlay_config** (last_combat_data, last_updated_at). On outcome or end-of-pull, insert **pulls** (pull_number, duration_sec, dps_snapshot, outcome). Return 200 + { ok, pull_number }.
- **CORS:** Allow overlay origins (e.g. * for this route, or list null, file://, and Hydaelyn origin) so OverlayPlugin CEF and file:// overlays can POST.

### 3.3 Session Stats API (Overlay Page and Dashboard)

- **Route:** **apps/hydaelyn/app/api/sessions/[token]/stats/route.ts** (GET). Token = overlay_token.
- **Logic:** Using admin or anon client, load stream_session by overlay_token; load overlay_config; aggregate pulls (count, best duration/DPS). Return JSON (pull_count, best_pull_duration_sec, best_pull_dps, last_encounter_*). 404 if token invalid. No auth required for this read (token is the scope).

### 3.4 OBS Overlay Page (Pull Stats on Our Website)

- **Route:** **apps/hydaelyn/app/overlay/stream/page.tsx** (or app/(overlay)/overlay/stream/page.tsx). Read token from searchParams (?token=).
- **UI:** Minimal: pull count, best pull, optional current encounter DPS; transparent or semi-transparent; large text; no buttons (OBS click-through). Tailwind; optional theme via query param.
- **Data:** Poll GET /api/sessions/[token]/stats every 10–15 s, or subscribe to Supabase Realtime for overlay_config/stream_sessions if desired.

### 3.5 ACT Ingest Overlay Bundle

- **Source:** **resources/ffxiv/overlays/act-ingest/** (index.html, script.js). Load OverlayPlugin common.min.js; addOverlayListener('CombatData', …); POST to Hydaelyn origin (configurable) /api/ingest/combat with overlay_token and encounter/combatants. Throttle (e.g. every 5 s). Optional: detect combat end and send outcome.
- **Serving:** Copy to **apps/hydaelyn/public/overlays/act-ingest/** via **tools/ffxiv/copy-overlays.mjs** (script already targets apps/hydaelyn). Users point OverlayPlugin at the deployed URL (e.g. https://hydaelyn.moodmnky.com/overlays/act-ingest/) and paste overlay_token (from Hydaelyn dashboard).

### 3.6 Dashboard in Hydaelyn (Create Session, Overlay URLs)

- **Route:** **apps/hydaelyn/app/dashboard/page.tsx** (or app/(dashboard)/dashboard/page.tsx). Protect with Supabase auth (middleware or server component check).
- **Actions:** “Create stream session” → insert **stream_sessions** (profile_id = auth.uid(), name, overlay_token = crypto.randomUUID()). Show **OBS overlay URL** (e.g. https://…/overlay/stream?token=…) and **ACT ingest overlay URL** (…/overlays/act-ingest/) and instruct user to paste token in overlay config. List user’s stream_sessions with links and optional stats.

### 3.7 Copy Script and Docs

- **tools/ffxiv/copy-overlays.mjs** already targets **apps/hydaelyn/public/overlays/**; no change needed. Run after scaffolding so act-ingest (and miniparse, current-pull, act-connection-test) are available under the Hydaelyn app.
- **Docs:** Add **docs/FFXIV-ACT-Ingest-Overlay.md** (or extend docs/ACT-Supabase-ODBC-Setup.md): how to add the act-ingest overlay in OverlayPlugin, where to get the overlay token (Hydaelyn dashboard), and API base URL (Hydaelyn app origin). Reference Hydaelyn as the app that serves overlays and ingest.

### 3.8 Optional: Schema hydaelyn and PDF-Style Events (Phase 2)

- **Migration:** Create schema **hydaelyn**; tables **encounters** (id, report_id, start_time, end_time, zone, boss, party_composition, created_by, …), **combat_events** (id, encounter_id, timestamp, type, source, target, ability_id, damage, metadata JSONB). RLS as needed. Realtime publication for these tables if the app or companion subscribes.
- **Local companion (Node/TS):** Subscribe to OverlayPlugin WS (ws://127.0.0.1:10501/ws), normalize events to the above schema, batch insert into **hydaelyn.combat_events** and manage **hydaelyn.encounters**. Optional: package as standalone executable (pkg/nexe) and document in Hydaelyn README.
- **packages/hydaelyn-sdk:** Shared fflogs.ts, supabase.ts, discord.ts, ai.ts for use by apps/hydaelyn and the companion. Add to pnpm-workspace and turbo as needed.

---

## 4. Implementation Order (Concrete)

1. **Scaffold apps/hydaelyn** (Next.js, TypeScript, pnpm, @supabase/ssr, @supabase/supabase-js, shadcn, Tailwind), lib/supabase (server, client, admin), env wiring, middleware if using auth.
2. **Ingest API:** POST /api/ingest/combat with Zod, admin client, token lookup, overlay_config upsert, pulls insert, CORS.
3. **Session stats API:** GET /api/sessions/[token]/stats.
4. **ACT ingest overlay:** Add resources/ffxiv/overlays/act-ingest (index.html, script.js); run copy-overlays after app exists so it lands in apps/hydaelyn/public/overlays/.
5. **OBS overlay page:** app/overlay/stream with token from query, poll stats API, minimal UI.
6. **Dashboard:** Auth-protected page to create stream session, show overlay URLs, list sessions.
7. **Docs:** FFXIV-ACT-Ingest-Overlay (and any ACT-Supabase-ODBC updates).
8. **(Later)** Schema hydaelyn, encounters/combat_events, local companion, packages/hydaelyn-sdk, Discord, FFLogs, OpenAI per PDF roadmap.

---

## 5. Verification Summary

| Item | Source | Status |
|------|--------|--------|
| stream_sessions, pulls, overlay_config | Local Supabase public | Present; structure matches Option B / PRD |
| hydaelyn schema, encounters, combat_events | PDF | Not present locally; Phase 2 |
| Auth pattern (SSR) | Monorepo (apps/web, mood-mnky, code-mnky) | Use @supabase/ssr + @supabase/supabase-js |
| Copy script target | tools/ffxiv/copy-overlays.mjs | apps/hydaelyn/public/overlays/ |
| Production DB | Not verified this pass | Run migrations and verify schema when deploying |

---

## 6. References

- **PDF:** temp/ACT Supabase Next.js Overlay Ideas.pdf (Comprehensive Plan to Build the Hydaelyn Platform).
- **PRD:** PRD-FFXIV-Pull-Stats-Stream-Command-Center.md.
- **Option B plan:** Option B Encounter Data on App (plan).
- **Supabase SSR:** [Supabase Docs – Next.js SSR](https://supabase.com/docs/guides/auth/server-side/nextjs).
- **Repo:** apps/web (Supabase server/admin client patterns), apps/mood-mnky (structure), resources/ffxiv/overlays, tools/ffxiv/copy-overlays.mjs.
