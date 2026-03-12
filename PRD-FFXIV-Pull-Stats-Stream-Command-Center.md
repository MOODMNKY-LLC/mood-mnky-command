# PRD: Pull Stats & Stream Command Center

## Overview and objectives

The Pull Stats & Stream Command Center is a web application that serves streamers and progression raiders with current-pull and best-pull statistics, pull leaderboards, OBS-ready overlay URLs, and optional real-time ingestion of ACT data via a custom OverlayPlugin overlay. It combines “Pull Stats & Stream Widget” with a lightweight “Encounter IQ” experience (in-app encounter insights; optional browser extension in a later phase). Data can come from FFLogs (polling latest report) and/or from a custom overlay that sends CombatData from ACT to the backend. Encounter and pull semantics are aligned with Cactbot (e.g. pull count, encounter IDs). The product is deployable to Vercel; real-time updates use Supabase Realtime or polling, not server-side WebSockets.

## Target audience

- **Primary:** Streamers who want OBS overlays showing pull count, best pull, DPS percentiles, and related stats.
- **Secondary:** Progression raiders who want a live view of session stats; viewers who see the overlay on stream.

## Core features and functionality

- **Pull stats from FFLogs:** For a linked character or report, show current best pull, total pulls (24h and all-time), DPS percentiles, and historic best. Data from FFLogs reportData; polling or on-demand refresh. Acceptance criteria: User can connect a report or character; dashboard shows pull count and best pull for selected encounter; data respects cache and rate limits.
- **OBS-ready overlay URLs:** Public or authenticated URLs (e.g. `/overlay/stream?token=...`) that render a minimal overlay (pull count, best pull, optional DPS). OBS Browser Source points at the URL; overlay polls API or Supabase for latest data. Acceptance criteria: Overlay page loads in OBS; displays at least pull count and best pull; updates within configurable interval (e.g. 15–60s).
- **Optional live ACT integration:** Custom OverlayPlugin overlay (HTML/JS) that receives `CombatData` (and optionally `LogLine`, `ChangeZone`) via OverlayPlugin’s `common.js` and sends a pull summary or key metrics to the app (POST to Next.js API or Supabase). Enables real-time pull count and DPS without waiting for FFLogs upload. Acceptance criteria: Documented overlay bundle; overlay can POST to `/api/ingest/combat` or write to Supabase (e.g. Realtime or REST) with a session/overlay token; backend stores last pull and session stats; overlay URL can show this data when ACT is sending.
- **Session and pull tracking:** Backend stores “sessions” (user/overlay, encounter, start time) and per-pull data (pull number, duration, wipe/kill, optional DPS snapshot). When ACT overlay is used, session is created/updated by ingest endpoint; when FFLogs-only, session can be derived from report polling. Acceptance criteria: Sessions and pulls are queryable; overlay and dashboard show consistent pull count and best pull for the session.
- **Pull leaderboards (optional):** By encounter and class, show leaderboard of best pulls (from FFLogs or from ingested data). Acceptance criteria: At least one view (e.g. “best pulls this tier”) from public or user-scoped data; Phase 2 acceptable.
- **Encounter IQ (lightweight):** In-app encounter insights (e.g. phase names, key mechanics) aligned with Cactbot; optional Phase 2 browser extension that adds “View in Command Center” or similar on FFLogs pages. Acceptance criteria: In-app encounter info uses same IDs/names as Cactbot; extension is optional and documented as separate deliverable.

Acceptance criteria for the product: Users can sign in (Supabase), optionally link FFLogs, create or join a “stream session,” get an overlay URL for OBS, and see pull stats (from FFLogs and/or ACT overlay) on the dashboard and in the overlay.

## Technical stack recommendations

- **Frontend:** pnpm, Next.js (App Router), TypeScript, shadcn, Tailwind CSS. Deploy to Vercel.
- **Backend:** Next.js API routes; Supabase (Postgres, Auth, Realtime). Serverless; no WebSockets on Vercel.
- **Real-time:** Supabase Realtime for overlay and dashboard when using ACT ingest; or polling (overlay and dashboard poll API or Supabase). Overlay runs in user’s browser (OBS or OverlayPlugin CEF), so it can open Realtime channel or poll.
- **FFLogs:** Same as other apps (v2 GraphQL; client credentials + optional OAuth); cache and rate-limit strategy.
- **Auth:** Supabase (email/magic link); “Link FFLogs” for report-based stats. Overlay URLs can use a short-lived token (e.g. in query or cookie) that maps to a session so OBS doesn’t require full login in the browser source.
- **Overlay security:** Ingest endpoint `/api/ingest/combat` (or Supabase write) should require a session token or API key that the user generates in the app and pastes into overlay config; avoid unauthenticated public write. Rate limit ingest by token/session.
- **ACT overlay bundle:** Single HTML/JS (and optional CSS) file that includes OverlayPlugin `common.js`, subscribes to `CombatData` (and optionally other events), and POSTs to your API or writes to Supabase. Served from your app (e.g. `/overlay/act-bridge.html`) or downloadable; docs for “add as custom overlay in OverlayPlugin.”
- **Validation:** Zod for ingest payload and API responses; type-safe FFLogs and Supabase usage.

## Conceptual data model

- **profiles:** id (Supabase Auth), email, created_at, updated_at.
- **user_fflogs_tokens:** id, profile_id (FK), access_token, refresh_token, expires_at, created_at, updated_at. Optional; for report-based pull stats.
- **stream_sessions:** id, profile_id (FK), name, overlay_token (unique), encounter_id or zone_id, started_at, ended_at, source (fflogs | act_ingest), created_at, updated_at. One active session per overlay token; token used in overlay URL and ingest.
- **pulls:** id, stream_session_id (FK), pull_number, duration_sec, outcome (wipe | kill), dps_snapshot (jsonb), started_at, ended_at. Filled by ingest or derived from FFLogs when polling report.
- **overlay_config:** id, stream_session_id (FK), last_combat_data (jsonb), last_updated_at. Optional; for ACT overlay to write latest CombatData for real-time overlay display without storing every tick.
- **report_cache:** id, report_code (unique), report_snapshot (jsonb), cached_at. Same pattern as other apps for FFLogs report metadata.

RLS: users see only their own sessions and pulls; overlay token grants write access only to that session’s pulls and config (enforced in API or RLS).

## UI design principles

- **Dashboard:** Create/select stream session; copy overlay URL (with token); view current pull, best pull, and session stats. Optional link to FFLogs report. Minimal, streamer-friendly layout.
- **Overlay page (`/overlay/stream`):** Transparent or semi-transparent background; large, readable pull count and best pull; optional DPS; no buttons or links (OBS click-through). Configurable via query params (e.g. theme, fields to show).
- **ACT overlay (ingest):** Documentation and single HTML/JS bundle; user adds URL in OverlayPlugin and pastes overlay token in config; overlay sends data on interval or on combat end. No complex UI in overlay.
- **Settings:** Generate overlay token; link/unlink FFLogs; optional notification (Phase 2).

## ACT / Cactbot integration

- **ACT / OverlayPlugin:** Optional custom overlay that uses OverlayPlugin’s `addOverlayListener('CombatData', ...)` (and optionally `LogLine`, `ChangeZone`) and POSTs to `/api/ingest/combat` or writes to Supabase. Overlay runs inside ACT’s overlay process (or browser with OverlayPlugin WSServer); backend receives data and updates `pulls` and `overlay_config`. No ACT binary or plugin modification; only a custom overlay page.
- **Cactbot:** Pull count and encounter IDs aligned with Cactbot so labels and pull semantics match what raiders see in Cactbot (e.g. pull counter module). No direct Cactbot API; data alignment only.

## Security considerations

- Overlay token: generated per session; stored in app and passed in overlay URL. Ingest endpoint validates token and associates data with that session; rate limit by token to prevent abuse.
- No FFLogs tokens in overlay or client; all FFLogs calls from API routes. Supabase anon key in overlay is acceptable only for scoped writes (e.g. to a channel or table restricted by RLS to that session).
- OBS overlay URL can be long-lived; recommend “regenerate token” to invalidate old URLs if needed.

## Development phases / milestones

- **Phase 1:** Supabase schema (profiles, user_fflogs_tokens, stream_sessions, pulls, overlay_config, report_cache); Auth and “Link FFLogs”; create stream session and generate overlay URL; overlay page at `/overlay/stream` that polls API for session’s pull stats (mock or FFLogs-derived); ingest endpoint `POST /api/ingest/combat` with token validation and rate limiting; minimal ACT overlay bundle (HTML/JS) and docs.
- **Phase 2:** FFLogs polling for report-based pull stats and best pull; Supabase Realtime (or polling) so overlay updates when ACT sends data; dashboard shows live session stats; pull leaderboards (in-app, optional).
- **Phase 3:** Encounter IQ (in-app encounter info); optional browser extension (e.g. “View in Command Center” on FFLogs); polish and streamer-facing documentation.

## Potential challenges and solutions

- **Vercel timeout:** No long-lived connections on Vercel; use Supabase Realtime or polling from overlay and dashboard. Ingest is a short POST; no issue.
- **ACT overlay CORS:** Ingest endpoint must allow requests from overlay origin (OverlayPlugin CEF or file://). Configure CORS for your API and/or use Supabase client from overlay with RLS.
- **Duplicate pulls:** When both ACT ingest and FFLogs report exist, define rule (e.g. prefer ACT for “live” session; FFLogs for historic); avoid double-counting pulls.

## Future expansion possibilities

- Browser extension for “Encounter IQ” on FFLogs (deep link to overlay or dashboard with report/encounter).
- Multiple overlay layouts (minimal, full, custom CSS) and themes.
- Integration with stream alerts (e.g. "new best pull" trigger for stream software).

---

## Research & integration notes

- **ACT / OverlayPlugin:** ACT does not natively POST logs to a URL. Integration is via a **custom OverlayPlugin overlay** (HTML/JS) that uses `addOverlayListener('CombatData', ...)` (and optionally `LogLine`, `ChangeZone`) and POSTs to `/api/ingest/combat` with a session/overlay token. The overlay runs inside ACT's overlay process or OverlayPlugin's CEF; no ACT binary or plugin modification is required. OverlayPlugin API: [OverlayPlugin docs](https://overlayplugin.github.io/); ACT Plugin API: [advancedcombattracker.com/apidoc](https://advancedcombattracker.com/apidoc/).
- **Cactbot:** Cactbot is an overlay that consumes ACT data; it does not expose an HTTP API. "Integration" means **data alignment**: use the same encounter IDs, zone IDs, and pull semantics (e.g. pull count, encounter naming) as Cactbot so labels and logic match what raiders see. Reference Cactbot's data files (e.g. [cactbot](https://github.com/quisquous/cactbot)) for encounter/zone IDs and naming.
- **CORS:** The ingest endpoint must allow requests from the overlay origin (OverlayPlugin CEF or `file://`). Configure CORS on the API route or use Supabase client from the overlay with RLS scoped to the session token.
- **References:** FFLogs API (v2 GraphQL, OAuth): [Archon API Documentation](https://www.archon.gg/ffxiv/articles/help/api-documentation), [FFLogs API docs](https://www.fflogs.com/api/docs). App concept set: [CHATGPT-FFXIV-APP.md](CHATGPT-FFXIV-APP.md).

