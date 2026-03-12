-- Hydaelyn: stream_sessions, pulls, overlay_config for pull stats and ACT overlay ingest.
-- Purpose: Option B / PRD stream session tracking; overlay token scoped; RLS for authenticated owners.
-- Affected: new tables stream_sessions, pulls, overlay_config in public.
--
-- SAFE FOR EXISTING PRODUCTION: Additive only. No DROP TABLE, no TRUNCATE, no data removal.
-- Tables/indexes use IF NOT EXISTS; policies use DROP IF EXISTS then CREATE (same definitions).
-- Safe to run against your already-in-use production database.

-- ========== 1. stream_sessions ==========
create table if not exists public.stream_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Stream session',
  overlay_token text not null unique,
  encounter_id text,
  zone_id text,
  started_at timestamptz,
  ended_at timestamptz,
  source text not null check (source in ('act_ingest', 'fflogs')) default 'act_ingest',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.stream_sessions is 'Stream sessions for pull stats; one overlay_token per session; owner is profile_id.';

create index if not exists stream_sessions_profile_id_idx on public.stream_sessions(profile_id);
create index if not exists stream_sessions_overlay_token_idx on public.stream_sessions(overlay_token);

alter table public.stream_sessions enable row level security;

-- authenticated: select own sessions only
drop policy if exists "stream_sessions_select_own" on public.stream_sessions;
create policy "stream_sessions_select_own"
  on public.stream_sessions for select to authenticated
  using (profile_id = auth.uid());

-- authenticated: insert own sessions (profile_id = self)
drop policy if exists "stream_sessions_insert_own" on public.stream_sessions;
create policy "stream_sessions_insert_own"
  on public.stream_sessions for insert to authenticated
  with check (profile_id = auth.uid());

-- authenticated: update only own sessions
drop policy if exists "stream_sessions_update_own" on public.stream_sessions;
create policy "stream_sessions_update_own"
  on public.stream_sessions for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- authenticated: delete only own sessions
drop policy if exists "stream_sessions_delete_own" on public.stream_sessions;
create policy "stream_sessions_delete_own"
  on public.stream_sessions for delete to authenticated
  using (profile_id = auth.uid());

-- anon: no access (ingest uses service role)
-- no policy for anon: default deny.

-- ========== 2. pulls ==========
create table if not exists public.pulls (
  id uuid primary key default gen_random_uuid(),
  stream_session_id uuid not null references public.stream_sessions(id) on delete cascade,
  pull_number int not null,
  duration_sec numeric,
  outcome text check (outcome in ('wipe', 'kill')),
  dps_snapshot jsonb,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.pulls is 'Per-pull data for a stream session; filled by ingest or FFLogs.';

create index if not exists pulls_stream_session_id_idx on public.pulls(stream_session_id);

alter table public.pulls enable row level security;

-- authenticated: select pulls for sessions they own
drop policy if exists "pulls_select_own_session" on public.pulls;
create policy "pulls_select_own_session"
  on public.pulls for select to authenticated
  using (
    stream_session_id in (
      select id from public.stream_sessions where profile_id = auth.uid()
    )
  );

-- authenticated: insert not allowed from client (ingest API uses service role)
-- we allow insert for authenticated if they own the session (e.g. dashboard could create placeholder)
drop policy if exists "pulls_insert_own_session" on public.pulls;
create policy "pulls_insert_own_session"
  on public.pulls for insert to authenticated
  with check (
    stream_session_id in (
      select id from public.stream_sessions where profile_id = auth.uid()
    )
  );

-- authenticated: update/delete only for own session (rare; usually ingest-only)
drop policy if exists "pulls_update_own_session" on public.pulls;
create policy "pulls_update_own_session"
  on public.pulls for update to authenticated
  using (
    stream_session_id in (
      select id from public.stream_sessions where profile_id = auth.uid()
    )
  )
  with check (
    stream_session_id in (
      select id from public.stream_sessions where profile_id = auth.uid()
    )
  );

drop policy if exists "pulls_delete_own_session" on public.pulls;
create policy "pulls_delete_own_session"
  on public.pulls for delete to authenticated
  using (
    stream_session_id in (
      select id from public.stream_sessions where profile_id = auth.uid()
    )
  );

-- ========== 3. overlay_config ==========
create table if not exists public.overlay_config (
  id uuid primary key default gen_random_uuid(),
  stream_session_id uuid not null references public.stream_sessions(id) on delete cascade unique,
  last_combat_data jsonb,
  last_updated_at timestamptz not null default now()
);

comment on table public.overlay_config is 'Latest CombatData per stream session for live overlay display; upserted by ingest.';

create index if not exists overlay_config_stream_session_id_idx on public.overlay_config(stream_session_id);

alter table public.overlay_config enable row level security;

-- authenticated: select overlay_config for own sessions
drop policy if exists "overlay_config_select_own_session" on public.overlay_config;
create policy "overlay_config_select_own_session"
  on public.overlay_config for select to authenticated
  using (
    stream_session_id in (
      select id from public.stream_sessions where profile_id = auth.uid()
    )
  );

-- authenticated: insert for own session (ingest uses service role; this allows dashboard to pre-create if needed)
drop policy if exists "overlay_config_insert_own_session" on public.overlay_config;
create policy "overlay_config_insert_own_session"
  on public.overlay_config for insert to authenticated
  with check (
    stream_session_id in (
      select id from public.stream_sessions where profile_id = auth.uid()
    )
  );

-- authenticated: update for own session
drop policy if exists "overlay_config_update_own_session" on public.overlay_config;
create policy "overlay_config_update_own_session"
  on public.overlay_config for update to authenticated
  using (
    stream_session_id in (
      select id from public.stream_sessions where profile_id = auth.uid()
    )
  )
  with check (
    stream_session_id in (
      select id from public.stream_sessions where profile_id = auth.uid()
    )
  );

-- authenticated: delete for own session
drop policy if exists "overlay_config_delete_own_session" on public.overlay_config;
create policy "overlay_config_delete_own_session"
  on public.overlay_config for delete to authenticated
  using (
    stream_session_id in (
      select id from public.stream_sessions where profile_id = auth.uid()
    )
  );
