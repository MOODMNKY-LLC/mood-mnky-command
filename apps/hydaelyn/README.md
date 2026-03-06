# Hydaelyn

FFXIV Pull Stats & Stream Command Center — stream sessions, OBS overlay, ACT ingest, FFLogs sync, and report insights in one app.

## Features

- **Stream sessions** — Create a session from the dashboard to get a unique overlay token for OBS and ACT.
- **OBS overlay** — Add the overlay URL as a browser source to show pull count and best pull on stream.
- **ACT ingest** — Point OverlayPlugin at the ACT ingest overlay; combat data is sent to Hydaelyn and the overlay updates.
- **Discord sign-in** — Primary auth: "Sign in with Discord" (hero and header). Same Supabase project as the rest of the monorepo.
- **Email/password** — Sign in, sign up, forgot password, update password.
- **FFLogs** — Link FFLogs account; view "My FFLogs reports" on the dashboard and open report viewer (fights, details). Sign in with FFLogs optional.
- **Report insights** — AI-generated summary (and optional briefing/coaching) for a report via OpenAI; cached in `report_insights`.
- **ACT ODBC** — Optional schema `hydaelyn` with tables mirroring ACT ODBC export (`encounter_table`, `combatant_table`, etc.); app shows ACT data in the **ACT / Raid Data** context. Realtime publication optional for live updates.
- **Dashboard contexts** — Team switcher in the sidebar header switches between **FFLogs** (reports, link account), **Live / Overlay** (stream sessions, OBS/ACT URLs), and **ACT / Raid Data** (encounters, combatants, current table, AI insights). Context is URL-based: `/dashboard/fflogs`, `/dashboard/live`, `/dashboard/act`.
- **Theme** — Hydaelyn palette (crystal/azure, gold accent), light/dark mode with next-themes. Root header is hidden on dashboard routes so the sidebar and dashboard header are not obscured.

## Stack

- Next.js (App Router), TypeScript, pnpm
- Supabase (Auth, Postgres, Realtime) via `@supabase/ssr` and `@supabase/supabase-js`
- shadcn/ui, Tailwind CSS, next-themes

## Environment

Use the monorepo root `.env.local` and `.env`. Variables:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Ingest API and session stats (bypasses RLS) |
| `FFLOGS_CLIENT_ID` | FFLogs OAuth client ID |
| `FFLOGS_CLIENT_SECRET` | FFLogs OAuth client secret |
| `NEXT_PUBLIC_FFLOGS_ENABLED` | Set `true` to show FFLogs UI in production |
| `OPENAI_API_KEY` | Report insights (summary/briefing/coaching) |
| `OPENAI_MODEL` | Optional; default `gpt-4o-mini` |
| `NEXT_PUBLIC_HYDAELYN_URL` | Optional; base URL for overlay links (defaults to host) |

Discord is configured in Supabase Dashboard (Authentication → Providers → Discord). Add your Hydaelyn origin and callback (e.g. `http://localhost:3012/auth/callback`) to Redirect URLs.

Dev loads env via `dotenv -e ../../.env.local -e ../../.env`.

## Scripts

- `pnpm dev` — Dev server on port 3012
- `pnpm build` — Production build
- `pnpm start` — Start production server
- `pnpm lint` — ESLint

From repo root: `pnpm dev:hydaelyn` if configured in root `package.json`.

## Deploy (Vercel)

In Vercel, set **Root Directory** to `apps/hydaelyn`. This app’s `vercel.json` overrides install and build so that:

- Install runs from the monorepo root (`pnpm install`).
- Build runs Turbo with the **package name** filter: `--filter=hydaelyn` (do not use path filters like `/apps/hydaelyn` or `{/apps/hydaelyn}` — Turbo rejects them as “invalid anchored path”).

If you use a custom Build Command in the dashboard, it must use `--filter=hydaelyn`, not `--filter={/apps/hydaelyn}`.

## Overlay token

The **overlay token** is a UUID that ties a stream session to the ACT and OBS overlays:

- **Where:** Create a stream session on the dashboard; the token is shown on the session card and in the ACT ingest URL.
- **Use:** OBS overlay = `/overlay/stream?token=<overlay_token>`. ACT overlay = add `?token=<overlay_token>` to the act-ingest overlay URL.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing (hero, features, roadmap); CTAs: Sign in with Discord, Link FFLogs |
| `/dashboard` | Redirects to `/dashboard/fflogs` |
| `/dashboard/fflogs` | FFLogs context: link account, My FFLogs reports list |
| `/dashboard/live` | Live context: create stream session, list sessions with OBS/ACT overlay URLs |
| `/dashboard/act` | ACT / Raid Data context: encounter_table, combatant_table, current_table; AI insights per encounter |
| `/reports/[code]` | Report viewer (fights, insights) |
| `/overlay/stream?token=...` | OBS overlay |
| `/overlays/act-ingest/?token=...` | ACT OverlayPlugin overlay |
| `/auth/signin` | Sign in (Discord, email/password) |
| `/auth/signup` | Create account |
| `/auth/forgot-password` | Request password reset |
| `/auth/update-password` | Set new password |
| `/auth/fflogs/authorize?intent=link` or `?intent=signin` | Start FFLogs OAuth |
| `/auth/fflogs/callback` | FFLogs OAuth callback |

## API

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/ingest/combat` | ACT overlay ingest (overlay_token, encounter, combatants) |
| GET | `/api/sessions/[token]/stats` | Session stats by overlay_token |
| GET | `/api/fflogs/reports` | User's FFLogs report list (auth, FFLogs linked) |
| GET | `/api/fflogs/reports/[code]` | Report detail (auth, FFLogs linked) |
| GET | `/api/reports/[code]/insights?type=summary` | Cached insight (auth) |
| POST | `/api/reports/[code]/insights` | Generate/cache insight (body: `{ type: "summary" }` or briefing/coaching) |
| POST | `/api/act/insights` | AI insight for an ACT encounter (body: `{ encid: string }`; uses hydaelyn.encounter_table + combatant_table) |

## Database

- **public:** `stream_sessions`, `pulls`, `overlay_config`, `profiles`, `user_fflogs_tokens`, `fflogs_response_cache`, `report_insights`.
- **hydaelyn:** Optional ACT ODBC mirror — `encounter_table`, `combatant_table`, `current_table`, `damagetype_table`. See migrations `20260503120000_hydaelyn_act_odbc_views.sql`, `20260505120000_hydaelyn_schema_grants.sql`, `20260505130000_hydaelyn_realtime_publication.sql`. Schema grants allow the app to query via `supabase.schema('hydaelyn')`; Realtime publication enables optional live updates for these tables.

Migrations are additive only; safe to run against an existing production database.

## Auth

- **Discord:** Configure in Supabase Dashboard. Redirect URL must include `https://<hydaelyn-host>/auth/callback` (and `http://localhost:3012/auth/callback` for dev).
- **Email/password:** Supabase Auth; confirm and reset links use `/auth/confirm` and `/auth/update-password`.
- **FFLogs:** Register a client at [FFLogs API clients](https://www.fflogs.com/api/clients/). Redirect URI: `http://localhost:3012/auth/fflogs/callback` (dev), `https://<hydaelyn-host>/auth/fflogs/callback` (prod).

## ACT & Cactbot

- **ACT OverlayPlugin** — [OverlayPlugin](https://github.com/ngld/OverlayPlugin) for combat data and overlays. Hydaelyn’s ACT ingest overlay POSTs to `/api/ingest/combat`.
- **Cactbot** — [Cactbot](https://github.com/quisquous/cactbot) provides overlays and triggers; pull/encounter semantics align where relevant. See also `docs/FFXIV-ACT-Ingest-Overlay.md` in the repo.

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for phased roadmap (Phase 1 = current; Phase 2 = deeper FFLogs + recaps; Phase 3 = mitigation/timeline, team, AI; Phase 4 = monetization).

## Design

Hyaelyn uses its own theme: crystal/azure primary, soft gold accent, light and dark mode. CSS variables are in `app/globals.css`; `data-theme="hydaelyn"` is set on the document. Theme toggle is in the header.
