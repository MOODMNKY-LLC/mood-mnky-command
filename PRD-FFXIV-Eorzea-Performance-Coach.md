# PRD: Eorzea Performance Coach

## Overview and objectives

The Eorzea Performance Coach is a web application that turns FFLogs report data into personalized, actionable performance feedback for Final Fantasy XIV players. It surfaces metrics such as GCD uptime, oGCD usage efficiency, buff alignment, and missed opportunities, and provides job-specific rotation suggestions and “what to fix” guidance. The product merges individual performance breakdowns (idea 1) with class-expert analysis and skill mentoring (idea 4) from the FFXIV app concept set. It is deployable to Vercel and uses FFLogs v2 GraphQL exclusively from the server, with aggressive caching and rate-limit awareness.

## Target audience

- **Primary:** Solo and static players who want to improve and understand *how* to improve, not just raw DPS numbers.
- **Secondary:** Static leaders who want to compare member performance or share coach links; players who prefer private reports (via optional “Link FFLogs” OAuth).

## Core features and functionality

- **Report ingestion:** User provides an FFLogs report code (public) or connects FFLogs via OAuth to access private reports. Backend fetches report metadata and events via FFLogs v2 GraphQL (client credentials for public; user token for private). Acceptance criteria: Report code or “Link FFLogs” flow; server-side only FFLogs calls; report metadata and events cached per report with policy (short cache for recent reports, indefinite for old).
- **Performance metrics:** Compute and display GCD uptime, oGCD usage efficiency, ability overlap, buff downtime, and missed buff opportunities. Acceptance criteria: At least these core metrics per job/actor; derived from report events (ability casts, buff applications); optional overlay plots of ability timing vs fight phases.
- **Job-specific suggestions:** Per-job “what to fix” based on common rotation mistakes, phase-specific priorities, and optional comparison to benchmarks. Acceptance criteria: Job rotation checklist with weightings; “what to fix” tied to log events; performance grades (e.g. A/B/C) where applicable.
- **Optional static view:** Compare multiple members’ coach results for the same report or tier. Acceptance criteria: Static leaders can view aggregated or side-by-side coach breakdowns for linked reports or roster.
- **Optional live session (future):** OverlayPlugin overlay sends a live combat snapshot to the app for “this pull” tips; encounter and job IDs aligned with Cactbot for consistent naming.

Acceptance criteria for the product: Users can sign in (Supabase), enter a report code or link FFLogs for private reports, view a performance breakdown with metrics and job-specific suggestions, and (optional) compare with static members.

## Technical stack recommendations

- **Frontend:** pnpm, Next.js (App Router), TypeScript, shadcn, Tailwind CSS. Deploy to Vercel.
- **Backend:** Next.js API routes; Supabase (Postgres, Auth). Serverless; no long-lived connections.
- **FFLogs:** v2 GraphQL (public `https://www.fflogs.com/api/v2/client` with client credentials; private `https://www.fflogs.com/api/v2/user` with user OAuth). All requests from API routes; client_id/client_secret in env only. Use `rateLimitData` in queries; cache report metadata and events (5–10 min for recent reports, indefinite for old).
- **Auth:** Supabase (email, magic link, or OAuth e.g. Discord/GitHub). Optional “Link FFLogs” via FFLogs OAuth (authorization code or PKCE); store tokens in `user_fflogs_tokens`.
- **Validation:** Zod for API request/response and FFLogs response shapes.

## Conceptual data model

- **profiles:** id (Supabase Auth), email, created_at, updated_at. Existing `public.profiles`.
- **user_fflogs_tokens:** id, profile_id (FK to profiles), access_token, refresh_token, expires_at, created_at, updated_at. Optional; for private report access.
- **report_cache:** id, report_code (unique), report_snapshot (jsonb), cached_at. FFLogs report metadata and optionally events; shared pattern with other FFXIV apps.
- **coach_results_cache:** id, report_code, actor_id or (report_code, encounter_id, actor_id), job_id, metrics_snapshot (jsonb), suggestions_snapshot (jsonb), created_at. Optional; to avoid recomputing heavy metrics on every page load.

RLS: users see only their own `user_fflogs_tokens`; report_cache can be keyed by report_code (public reports) or profile_id if scoped; coach_results_cache scoped by report access (e.g. report_code + optional profile).

## UI design principles

- **Dashboard:** Report input (code or “Use my FFLogs reports”); list of recent reports or saved reports; per-report drill-down to encounter → actor → metrics and suggestions.
- **Report view:** Fight list; select encounter and actor; show metrics (GCD uptime, oGCD efficiency, buff alignment, etc.) and job-specific “what to fix” with clear priority.
- **Static view (optional):** Side-by-side or list of members with links to their coach breakdown for the same report/tier.
- **Settings:** Link/unlink FFLogs; optional preferences (default job, tier filter).

## Security considerations

- FFLogs client credentials and user tokens never exposed to the client; all FFLogs requests from API routes.
- Store FFLogs user tokens encrypted or in a restricted table with RLS so only the owning profile can read/update.
- Rate limiting: respect FFLogs 3,600 points/hour; queue or back off when approaching limit; use cache aggressively.

## Development phases / milestones

- **Phase 1:** Supabase schema (user_fflogs_tokens, report_cache, coach_results_cache if used); Auth; report code input and server-side fetch (public API only); display report metadata and fight list; compute and show at least GCD uptime and one other metric for one job.
- **Phase 2:** “Link FFLogs” OAuth flow; private report access; full metrics set (oGCD efficiency, buff alignment, missed opportunities); job-specific suggestions and grades; caching and rateLimitData usage.
- **Phase 3:** Optional static view (compare members); coach_results_cache; optional OverlayPlugin overlay for “this pull” tips; Cactbot-aligned encounter/job IDs for labels.

## Potential challenges and solutions

- **Rate limit:** 3,600 points/hour is tight for many reports; cache everything possible; short TTL for live reports, long for old; consider queuing and background refresh.
- **Metric definitions:** GCD uptime and oGCD efficiency need clear, job-agnostic definitions from event data; reference community or FFLogs docs for ability types and buff IDs.
- **Job-specific logic:** Each job has different optimal rotation; start with a subset of jobs or generic rules, then expand.

## Future expansion possibilities

- OverlayPlugin overlay sending live combat snapshot for in-pull coaching.
- Cactbot encounter/job ID alignment for consistent naming across overlays and app.
- Export or share links to a specific encounter/actor coach view.
- Integration with Static & Raid Analytics (e.g. “View in Coach” from static dashboard).
