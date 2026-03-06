# PRD: Static & Raid Analytics Dashboard

## Overview and objectives

The Static & Raid Analytics Dashboard is a web application that gives raid groups a team-level view of performance across a tier. It aggregates FFLogs report data by static or guild to show tier progression, phase-wise DPS and damage taken, consistency across pulls, job balance, pull count, and clear time trends. The product serves static leaders and raid groups who want a single place to see strengths and weaknesses across multiple runs and members. It is deployable to Vercel and uses FFLogs v2 GraphQL from the server with heavy caching; optional n8n workflows can automate roster sync and report ingestion.

## Target audience

- **Primary:** Static leaders and raid officers who need aggregated analytics across the group.
- **Secondary:** Static members who want to see team progression and their own placement; streamers or communities that track multiple groups.

## Core features and functionality

- **Static and roster management:** Create or join a static; add members by character name, server, or FFLogs link. Acceptance criteria: CRUD for statics; roster with character identifiers; at least one “owner” or admin per static; optional link to FFLogs guild for auto-discovery.
- **Report aggregation:** Associate FFLogs reports with a static (by report code, guild, or manual link). Fetch report metadata and events via FFLogs v2 GraphQL; store or cache for aggregation. Acceptance criteria: Reports linked to static; server-side fetch only; cache policy (short for recent, long for old); respect rate limits.
- **Tier progression view:** Per-encounter and per-tier view of clears, pull counts, and best pulls. Acceptance criteria: List of encounters in tier; for each encounter, show best clear, total pulls, and trend over time; filter by date range or patch.
- **Phase-wise DPS and damage taken:** Per-fight phase breakdown of group DPS and damage taken. Acceptance criteria: Phase definitions aligned with encounter (e.g. from Cactbot or FFLogs); aggregate or per-member phase metrics; optional chart (heatmap or time series).
- **Consistency and job balance:** Consistency metrics across pulls (e.g. variance in DPS, death rate); job composition and balance across clears. Acceptance criteria: At least one consistency metric (e.g. std dev or spread); job distribution view; optional “balance” suggestion (e.g. underperforming role).
- **Pull count and clear time tracking:** Total pulls per encounter; clear time for kills; historic best. Acceptance criteria: Pull count (24h and all-time) per encounter; clear time for kills; comparison to previous tier or benchmark (optional).

Acceptance criteria for the product: Static leaders can create a static, add members, link reports, and view tier progression, phase DPS, consistency, and pull/clear metrics in a single dashboard.

## Technical stack recommendations

- **Frontend:** pnpm, Next.js (App Router), TypeScript, shadcn, Tailwind CSS. Deploy to Vercel.
- **Backend:** Next.js API routes; Supabase (Postgres, Auth). Serverless.
- **FFLogs:** v2 GraphQL (client credentials for public data); optional user OAuth for private reports. All requests from API routes; aggressive caching and rate-limit handling.
- **n8n (optional):** External n8n instance (existing N8N_API_URL pattern); workflows for “sync roster from FFLogs guild” or “ingest new report when URL added”; Next.js calls n8n or n8n calls Next.js webhooks.
- **Auth:** Supabase (email, magic link, or OAuth). Static membership and roles (e.g. owner, member) stored in app tables.
- **Validation:** Zod for API and ingest payloads.

## Conceptual data model

- **profiles:** id (Supabase Auth), email, created_at, updated_at. Existing `public.profiles`.
- **statics:** id, name, slug or external_id, owner_id (FK profiles), created_at, updated_at. Optional: fflogs_guild_id, fflogs_guild_name for sync.
- **static_members:** id, static_id (FK), profile_id (FK), character_name, character_server, role (owner | member), created_at, updated_at. Optional: fflogs_character_id for linking.
- **report_cache:** id, report_code (unique), report_snapshot (jsonb), cached_at. Shared with other FFXIV apps.
- **static_reports:** id, static_id (FK), report_code, added_by (FK profiles), created_at. Links reports to a static for aggregation.
- **aggregated_metrics:** id, static_id (FK), encounter_id, report_code, metric_type (e.g. phase_dps, pull_count, clear_time), payload (jsonb), computed_at. Materialized or cached aggregates to avoid recomputing on every request.

RLS: users see statics they own or are members of; static_reports and aggregated_metrics scoped by static_id with same membership check.

## UI design principles

- **Dashboard:** List of user’s statics; per-static summary (tier progress, last updated, member count).
- **Static detail:** Roster; linked reports; tier view (encounters with clear/pull stats); phase DPS and damage taken; consistency and job balance sections; pull count and clear time.
- **Filters:** By encounter, date range, patch; optional by member for “my performance in this static.”
- **Settings:** Create/edit static; invite or add members; link/unlink reports; optional n8n “sync from guild” trigger.

## Security considerations

- Static data visible only to members; owner can manage roster and report links.
- FFLogs credentials and tokens server-side only; no client exposure.
- Rate limit: cache and batch FFLogs requests; use n8n or background jobs for large syncs to spread load.

## Development phases / milestones

- **Phase 1:** Supabase schema (statics, static_members, report_cache, static_reports); Auth; create static and add members; link report by code; fetch and cache report metadata; display fight list and basic tier progression (clears, pull count per encounter).
- **Phase 2:** Phase-wise DPS and damage taken (phase definitions, aggregate per encounter); consistency metrics; job balance view; clear time tracking; optional materialized aggregated_metrics.
- **Phase 3:** n8n integration (sync roster from guild, webhook on new report); optional link to Eorzea Performance Coach (“View in Coach” per member); optional ACT/overlay session for “current pull” in dashboard; Cactbot encounter ID alignment for filters.

## Potential challenges and solutions

- **Rate limit:** Many reports per static can exhaust 3,600 points/hour; cache aggressively; background or n8n-driven refresh; prioritize recent reports.
- **Phase definitions:** Phases must match encounter structure; use Cactbot or FFLogs convention for phase boundaries and names.
- **Large rosters:** Pagination and lazy load for roster and report list; aggregate only on demand or on schedule.

## Future expansion possibilities

- Cross-static or community leaderboards (opt-in).
- Alerts (e.g. “new clear” or “new report linked”).
- Deeper integration with Eorzea Performance Coach (per-member coach link from static view).
- Optional ACT/OverlayPlugin “current pull” data in static dashboard.
