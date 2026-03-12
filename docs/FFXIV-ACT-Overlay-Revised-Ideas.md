# Revised FFXIV ACT Overlay Plugin Ideas — Stack-Aligned

This document revises the 10 end-to-end plugin/app ideas from the ACT Overlay Plugin Research plan with the following **mandatory stack and integration criteria**:

- **OpenAI integration** — Where applicable: summarization, coaching copy, encounter explanations, or chat-style Q&A.
- **Discord integration** — Notifications, bot commands, share links, or static/stream alerts.
- **Supabase** — Auth and primary database for all web apps; RLS and Realtime where needed.
- **Next.js (TypeScript)** — App Router; UI with **shadcn** and **Tailwind CSS**.
- **PWA** — Installable web app for dashboards and config; optional offline/cache for overlay config and static data.

---

## Stack Summary (All Ideas)

| Criterion | Usage across ideas |
| --------- | ------------------ |
| **Supabase** | Auth (email/magic link/OAuth), Postgres (sessions, pulls, reports, statics, coach cache, encounter data), Realtime for live overlay/dashboard updates. |
| **Next.js + TypeScript** | All web surfaces: dashboard, stream overlay page, encounter browser, coach UI, static analytics. App Router, API routes for ingest and proxies. |
| **shadcn + Tailwind** | All UI: forms, tables, cards, overlays (stream page), responsive layouts. Themed with CSS variables; dark/light where needed. |
| **PWA** | Installable dashboard and config app; manifest + service worker; optional offline cache for overlay URLs, encounter list, and session list. |
| **OpenAI** | Coach narrative (Idea 2), encounter/mechanic summaries (Idea 6, 10), death/wipe summaries (Idea 5), session summaries (Idea 9), Discord bot responses (shared). |
| **Discord** | Bot: pull count, best pull, session link, static alerts; optional slash commands and rich embeds; link unfurling for shared session/coach URLs. |

---

## Idea 1: Pull Stats & Stream Command Center (Revised)

**Use cases:** Unchanged — streamers show live pull count and best pull on OBS; raiders see session stats without FFLogs; viewers see current/best pull on stream.

**Stack alignment:**

- **Supabase:** Auth for dashboard; tables `stream_sessions`, `pulls`, `overlay_config`; Realtime for OBS overlay and dashboard when ACT ingest is active. Overlay token scoped via RLS or API validation.
- **Next.js (TypeScript):** App Router; dashboard (create session, copy URLs, view stats), API route `POST /api/ingest/combat` (token validation, upsert pulls/session), and route `/overlay/stream` for OBS (query token, poll or Realtime).
- **shadcn + Tailwind:** Dashboard: Card, Button, Input, Badge, Table for sessions and pulls; stream overlay page: minimal typography and layout (transparent-friendly), configurable via query params.
- **PWA:** Dashboard installable; manifest + service worker; cache session list and last fetched pull stats for quick load; optional “Add to Home Screen” for streamers.
- **OpenAI:** Optional: short “session summary” (e.g. “12 pulls, best 8:32, 2 kills”) for Discord or dashboard copy.
- **Discord:** Bot command or webhook: “/pullstats &lt;session_id&gt;” or “!pullstats” returns current pull count, best pull, link to dashboard; optional alert when “new best pull” or “kill” (user-configurable).

**Architecture (additions):** ACT overlay unchanged (CombatData → POST or Supabase). Backend: Next.js API + Supabase; dashboard and OBS page are Next.js pages. Discord bot (existing or new) reads from Supabase or calls internal API with bot token.

---

## Idea 2: Eorzea Performance Coach (Revised)

**Use cases:** Unchanged — report-based metrics and “what to fix”; static comparison; optional live “this pull” tips.

**Stack alignment:**

- **Supabase:** Auth; `report_cache`, `user_fflogs_tokens`, `coach_results_cache`; RLS per user for tokens and cached results.
- **Next.js (TypeScript):** Report input, report/encounter/actor drill-down, coach results view, optional static comparison view; API routes for FFLogs proxy and coach compute (or server actions).
- **shadcn + Tailwind:** Report/encounter picker (Select, Combobox), metrics cards (Card, Progress), suggestion list (List, Badge), optional charts (e.g. Recharts or shadcn-friendly); responsive for desktop and tablet.
- **PWA:** Installable coach app; cache report metadata and last coach result for the report; offline view of last loaded coach result if cached.
- **OpenAI:** **Primary:** Generate “what to fix” narrative and short bullet summaries from structured metrics (GCD uptime, oGCD efficiency, buff alignment). Optional: “Explain this metric” or “How do I improve X?” via chat-style API; responses stored or ephemeral. Tone: concise, actionable, job-aware.
- **Discord:** “/coach &lt;report_code&gt; [encounter]” or link share: bot posts embed with report link + “View in Coach” deep link; optional DM with top 3 suggestions (if user linked Discord to profile).

**Architecture (additions):** FFLogs v2 server-side unchanged. Coach “metrics → text” step can call OpenAI API (structured prompt + metrics JSON) from Next.js API or server action. Discord bot reads public report link or uses stored user token for private report summary (server-side only).

---

## Idea 3: Static & Raid Analytics Dashboard (Revised)

**Use cases:** Unchanged — tier progression, phase DPS, consistency, job balance, pull/clear metrics; “View in Coach” per member.

**Stack alignment:**

- **Supabase:** Existing schema: `statics`, `static_members`, `static_reports`, `report_cache`, `aggregated_metrics`; Auth and RLS for members/owners.
- **Next.js (TypeScript):** Static list, static detail, tier view, phase/consistency/job views; API routes for aggregation and FFLogs; “View in Coach” links to Idea 2 app with report + encounter + actor.
- **shadcn + Tailwind:** DataTable for roster and reports; Card and Chart for tier/phase metrics; Badge for clears; Tabs for encounter vs consistency vs job balance.
- **PWA:** Installable static dashboard; cache static list and last tier summary; optional push when “new report linked” (if push enabled).
- **OpenAI:** Optional: one-paragraph “static summary” (e.g. “Cleared 4/5 this week; healer damage up; tank deaths down”) for dashboard header or Discord.
- **Discord:** Bot: “/static progress” or “!static” for tier summary and link; optional webhook when new report is linked or when static clears an encounter (configurable per static).

**Architecture (additions):** No change to data model. Discord bot uses Supabase (with bot service key or authenticated user) to read static summary and post; OpenAI summary can be generated on-demand or cached in `aggregated_metrics` or a new `static_summaries` table.

---

## Idea 4: Live Rotation & Opener Tracker Overlay (Revised)

**Use cases:** Unchanged — DoW opener/rotation checklist in real time; practice and drift correction; optional backend for “good” openers.

**Stack alignment:**

- **Supabase:** Optional: store user opener templates and “reference” opener timestamps per job/encounter; Auth if user-specific openers are saved. Overlay can remain backend-free.
- **Next.js (TypeScript):** Optional config UI: pick job, select opener template, view “saved openers” (if backend). API route to save/load opener set. If bundled in main app: shadcn Select, Card, Switch for options.
- **shadcn + Tailwind:** Only if config page exists: form for job/opener, list of saved openers; overlay itself stays vanilla HTML/JS/CSS (or minimal Tailwind via CDN if served from app).
- **PWA:** If config is in Next.js app: config page is part of installable PWA; overlay URL and options can be cached for offline.
- **OpenAI:** Optional: “Why is step 5 often late?” — user selects step, backend sends last N pull timestamps to OpenAI for short tip (e.g. “Usually drifts after movement; try pre-positioning”).
- **Discord:** Optional: “/opener &lt;job&gt;” returns link to opener template or embedded checklist image/text for that job (from DB or static content).

**Architecture (additions):** Overlay logic unchanged. If backend: Next.js page for opener config; Supabase table e.g. `opener_templates`, `user_opener_saves`; optional API for “analyze drift” using OpenAI. Discord bot serves static or DB-backed opener info.

---

## Idea 5: Death & Wipe Timeline Overlay + Static Dashboard (Revised)

**Use cases:** Unchanged — in-session death list; static dashboard with per-pull death timeline; merge with report when available.

**Stack alignment:**

- **Supabase:** `stream_sessions`, `pulls`, `pull_deaths` (actor, timestamp, source_ability, etc.); Auth for dashboard; Realtime optional for live death list on second screen.
- **Next.js (TypeScript):** Dashboard: session → pull list → per-pull death timeline; API `POST /api/ingest/deaths` with token validation. Overlay: vanilla; POSTs on wipe/kill.
- **shadcn + Tailwind:** Dashboard: Table for pulls; per-pull timeline (vertical timeline or compact list); Badge for “wipe” vs “kill”; Card for session summary.
- **PWA:** Installable dashboard; cache session list and last opened pull timeline.
- **OpenAI:** **Primary:** “Pull summary” from death timeline (e.g. “Wipe at 4:32; deaths: Tank (2), Healer (1); likely mechanic Y”). Used in dashboard per-pull card or Discord.
- **Discord:** “/deaths &lt;session_id&gt; [pull]” or link share: bot posts last pull or selected pull death summary + “View timeline” link; optional static webhook “wipe” with one-line OpenAI summary.

**Architecture (additions):** Ingest and tables as in plan. Dashboard is Next.js + shadcn. After storing deaths, optional server action or API calls OpenAI with structured death list → short summary; store in `pull_deaths.summary` or return on demand. Discord bot reads from API or Supabase.

---

## Idea 6: Encounter Phase & Mechanic Callout Overlay (Stream) (Revised)

**Use cases:** Unchanged — viewers see phase and “next mechanic”; minimal spoiler-light text; optional Cactbot broadcast sync.

**Stack alignment:**

- **Supabase:** Optional: table `encounter_phases` (encounter_id, phase_index, name, start_time, mechanics[]) and `mechanic_definitions`; or static JSON in app. Auth not required for overlay; optional for “my custom phase labels” in dashboard.
- **Next.js (TypeScript):** Optional encounter/phase editor (admin or power user); API or static export for overlay to fetch phase data. Overlay remains standalone HTML/JS.
- **shadcn + Tailwind:** Editor (if any): Form, Input, Table for phase/mechanic list. Overlay: minimal text styling (can be Tailwind via CDN if served from app).
- **PWA:** If phase data is edited in app: that app can be PWA; overlay URL and phase JSON cached for offline overlay use.
- **OpenAI:** Optional: generate “mechanic explanation” text from mechanic ID/name (e.g. “What is Limit Cut?” → 1–2 sentence explanation). Used in Encounter IQ (Idea 10) or here for “current mechanic” tooltip.
- **Discord:** Optional: “/mechanic &lt;encounter&gt; &lt;phase&gt;” returns current phase and next mechanic text (for raid leads pre-pull).

**Architecture (additions):** Phase/mechanic data in Supabase or JSON; overlay fetches on load or ChangeZone. OpenAI used for short mechanic blurbs if not curated. Discord bot reads same data.

---

## Idea 7: Personal DPS vs Benchmark Overlay (Revised)

**Use cases:** Unchanged — live DPS vs 75th/95th percentile; streamers show parse progress; backend optional for benchmark source.

**Stack alignment:**

- **Supabase:** Optional: `benchmark_cache` (encounter_id, job_id, percentile, value, cached_at); Auth not required for overlay; API key or public read for benchmark endpoint.
- **Next.js (TypeScript):** API route `GET /api/benchmarks?encounter=&job=&percentiles=` returning cached or FFLogs-derived percentiles; dashboard (optional) to view benchmark table. Overlay: vanilla; GET benchmarks on ChangeZone or load.
- **shadcn + Tailwind:** Optional dashboard: Table of benchmarks by encounter/job; overlay can be served from app with Tailwind for bar/numbers.
- **PWA:** If dashboard exists: installable; cache benchmark table for offline overlay config.
- **OpenAI:** Optional: “Why am I below 75th?” — send current DPS + benchmark + job; return 2–3 bullet tips (generic or from job rules).
- **Discord:** “/benchmark &lt;job&gt; &lt;encounter&gt;” returns 50/75/95 percentiles and link to overlay or dashboard.

**Architecture (additions):** Benchmark API in Next.js; Supabase cache table; overlay GET on zone/encounter change. OpenAI for optional “tips” endpoint; Discord bot calls same API.

---

## Idea 8: Party Comp & Buff Alignment Overlay (Revised)

**Use cases:** Unchanged — 8-man comp, expected buffs, present/missing; optional backend for “expected comp” per encounter.

**Stack alignment:**

- **Supabase:** Optional: `expected_comps` (encounter_id, comp_json or role list), `expected_buffs` (job_id, buff_name, buff_id); overlay and Discord read from API.
- **Next.js (TypeScript):** Optional config page: set “expected comp” per encounter; API to read comp/buff list. Overlay: vanilla; fetches once or embeds from app.
- **shadcn + Tailwind:** Config: Select for encounter, grid for roles/jobs, Checkbox for expected buffs. Overlay: grid layout (Tailwind CDN if served from app).
- **PWA:** Config app installable; cache comp/buff data for overlay.
- **OpenAI:** Optional: “Suggest comp for [encounter]” — from encounter name + meta, return 1–2 sentence comp suggestion (e.g. “Double caster common; prefer melee for limit cut”).
- **Discord:** “/comp &lt;encounter&gt;” returns expected comp and key buffs; “/buffs” returns list of key raid buffs by job (from references or DB).

**Architecture (additions):** Overlay unchanged. Optional Supabase + Next.js for comp/buff config and API; OpenAI for comp suggestion; Discord bot reads API or static data.

---

## Idea 9: Session Replay & Pull Logger (Revised)

**Use cases:** Unchanged — review “what happened this pull” in web timeline; share session link; optional merge with static/report.

**Stack alignment:**

- **Supabase:** `stream_sessions`, `pulls`, `pull_events` (or payload in pulls jsonb); Auth for “my sessions”; RLS so only session owner (or token) can read/write. Realtime optional for “new pull” live list.
- **Next.js (TypeScript):** Dashboard: session list → pull list → per-pull replay (timeline of DPS, deaths, events). API `POST /api/ingest/pull` with token. Overlay: POST on combat end.
- **shadcn + Tailwind:** Session list (DataTable, Card); pull timeline (vertical timeline, Badge, Tooltip); replay controls (play/pause by time range if events have timestamps).
- **PWA:** Installable replay dashboard; cache session list and last opened pull for quick load; optional offline view of cached pull payload.
- **OpenAI:** **Primary:** “Pull summary” from pull payload (duration, DPS, deaths, key events) → 2–3 sentence narrative (e.g. “5:12 pull; 2 deaths before 50%; recovery after rez”). Shown in dashboard per pull and optionally in Discord.
- **Discord:** “/replay &lt;session_id&gt; [pull]” or link share: bot posts “Pull N: [summary]” and “View replay” link; optional “last pull summary” on wipe/kill webhook.

**Architecture (additions):** Ingest and schema as in plan. After saving pull, optional server action or API calls OpenAI with pull payload → summary; store in `pulls.summary` or generate on demand. Discord bot uses same API/summary.

---

## Idea 10: Encounter IQ & Mechanic Wiki Overlay (Revised)

**Use cases:** Unchanged — in-game short mechanic text; web encounter browser; “View in Encounter IQ” from FFLogs or static; optional extension.

**Stack alignment:**

- **Supabase:** Tables `encounters`, `phases`, `mechanics` (Cactbot-aligned IDs); Auth for “favorites” or “my notes” only; public read for encounter/phase/mechanic content. Optional `mechanic_summaries` (curated or OpenAI-generated).
- **Next.js (TypeScript):** Encounter browser (list → encounter → phases → mechanics); overlay config (which encounters to show). API or static export for overlay. Optional browser extension: “View in Encounter IQ” link from FFLogs.
- **shadcn + Tailwind:** Encounter list (Card, Badge); phase/mechanic accordion or Tabs; rich text or Markdown for mechanic text; overlay: minimal text (Tailwind CDN if from app).
- **PWA:** Installable encounter wiki; cache encounter/phase/mechanic list and body text for offline reading and overlay.
- **OpenAI:** **Primary:** Generate or expand mechanic explanations (1–2 sentences) from mechanic ID/name and optional raw trigger text; store in `mechanics.summary` or `mechanic_summaries`; fallback when no curated text. Optional: “Explain [mechanic]” chat in app.
- **Discord:** “/mechanic &lt;name&gt;” or “/encounter &lt;name&gt;” returns short explanation and link to Encounter IQ page; useful for raid leads in voice.

**Architecture (additions):** Content in Supabase; Next.js serves browser and API; overlay fetches by zone/encounter/phase. OpenAI fills or extends mechanic text; Discord bot reads same content and links to app.

---

## Cross-Cutting Implementation Notes

1. **Single app vs multiple apps:** All web surfaces (dashboard, stream overlay page, coach, static analytics, replay, Encounter IQ) can live in one Next.js app (e.g. `apps/hydaelyn` or `apps/web` under a `/ffxiv` or `/raid` scope) with shared Auth and Supabase, or be split by product (e.g. coach app, stream app). Single app simplifies PWA and shared components (shadcn, layout).
2. **Discord bot:** One bot can serve all commands (`/pullstats`, `/coach`, `/static`, `/deaths`, `/replay`, `/benchmark`, `/comp`, `/mechanic`) with subcommands or separate commands; use Supabase and internal API with bot token; avoid exposing API keys to client.
3. **OpenAI:** Centralize prompts and model choice (e.g. GPT-4o-mini for summaries); use API routes or server actions; store summaries in DB where useful to avoid repeated calls. Rate limit and cost controls per user/session.
4. **PWA:** One manifest and service worker per app; cache static assets and critical API responses (session list, encounter list, last coach result); `display_override: ['standalone', 'minimal-ui']` for app-like experience.
5. **Overlay deployment:** Fix [tools/ffxiv/copy-overlays.mjs](tools/ffxiv/copy-overlays.mjs) target to the app that serves overlays (e.g. `apps/web/public/overlays` or `apps/hydaelyn/public/overlays` once created); ensure overlay pages can load `common.min.js` and, if needed, app-specific config (e.g. API base URL, token placeholder).

---

## References

- Original plan: ACT Overlay Plugin Research & 10 FF14 Raider/DoW Plugin Ideas (plan file; do not edit).
- Project PRDs: [PRD-FFXIV-Pull-Stats-Stream-Command-Center.md](../PRD-FFXIV-Pull-Stats-Stream-Command-Center.md), [PRD-FFXIV-Eorzea-Performance-Coach.md](../PRD-FFXIV-Eorzea-Performance-Coach.md), [PRD-FFXIV-Static-Raid-Analytics.md](../PRD-FFXIV-Static-Raid-Analytics.md).
- Stack: Next.js App Router, Supabase (Auth + Postgres + Realtime), shadcn/ui, Tailwind CSS, OpenAI API, Discord bot (Discord.js or similar), PWA (next-pwa or workbox).
