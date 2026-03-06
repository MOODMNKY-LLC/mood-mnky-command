-- Hydaelyn: Static & Raid Analytics tables
-- Purpose: statics, static_members, report_cache, static_reports, aggregated_metrics for FFXIV raid group analytics.
-- All profile_id and owner_id reference public.profiles(id). RLS enables access for owners and members only.

-- ========== 1. statics ==========
create table if not exists public.statics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  fflogs_guild_id text,
  fflogs_guild_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(slug)
);

comment on table public.statics is 'Raid statics; owner and members can view. Slug is unique per app.';

create index statics_owner_id_idx on public.statics(owner_id);
create index statics_slug_idx on public.statics(slug);

alter table public.statics enable row level security;

-- ========== 2. static_members ==========
create table if not exists public.static_members (
  id uuid primary key default gen_random_uuid(),
  static_id uuid not null references public.statics(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  character_name text,
  character_server text,
  role text not null check (role in ('owner', 'member')),
  fflogs_character_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(static_id, profile_id)
);

comment on table public.static_members is 'Members of a static; one row per profile per static.';

create index static_members_static_id_idx on public.static_members(static_id);
create index static_members_profile_id_idx on public.static_members(profile_id);

alter table public.static_members enable row level security;

-- statics RLS policies (after static_members exists so select policy can reference it)
-- authenticated: select if owner or member
create policy "statics_select_owner_or_member"
  on public.statics for select to authenticated
  using (
    owner_id = auth.uid()
    or id in (select static_id from public.static_members where profile_id = auth.uid())
  );
-- authenticated: insert if owner_id = self
create policy "statics_insert_own"
  on public.statics for insert to authenticated
  with check (owner_id = auth.uid());
-- authenticated: update/delete only owner
create policy "statics_update_owner"
  on public.statics for update to authenticated
  using (owner_id = auth.uid());
create policy "statics_delete_owner"
  on public.statics for delete to authenticated
  using (owner_id = auth.uid());

-- select: if user is member of that static or owner of static
create policy "static_members_select_member_or_owner"
  on public.static_members for select to authenticated
  using (
    profile_id = auth.uid()
    or static_id in (select id from public.statics where owner_id = auth.uid())
    or static_id in (select static_id from public.static_members where profile_id = auth.uid())
  );
-- insert: only static owner (or self for join flow if we add that later)
create policy "static_members_insert_owner"
  on public.static_members for insert to authenticated
  with check (
    static_id in (select id from public.statics where owner_id = auth.uid())
  );
-- update/delete: static owner only
create policy "static_members_update_owner"
  on public.static_members for update to authenticated
  using (static_id in (select id from public.statics where owner_id = auth.uid()));
create policy "static_members_delete_owner"
  on public.static_members for delete to authenticated
  using (static_id in (select id from public.statics where owner_id = auth.uid()));

-- ========== 3. report_cache ==========
create table if not exists public.report_cache (
  id uuid primary key default gen_random_uuid(),
  report_code text not null unique,
  report_snapshot jsonb not null,
  cached_at timestamptz default now()
);

comment on table public.report_cache is 'Cached FFLogs report metadata/snapshots; shared across Hydaelyn app.';

create index report_cache_report_code_idx on public.report_cache(report_code);
create index report_cache_cached_at_idx on public.report_cache(cached_at desc);

alter table public.report_cache enable row level security;

-- authenticated can read; insert/update for authenticated (API will write after FFLogs fetch)
create policy "report_cache_select_authenticated"
  on public.report_cache for select to authenticated
  using (true);
create policy "report_cache_insert_authenticated"
  on public.report_cache for insert to authenticated
  with check (true);
create policy "report_cache_update_authenticated"
  on public.report_cache for update to authenticated
  using (true);

-- ========== 4. static_reports ==========
create table if not exists public.static_reports (
  id uuid primary key default gen_random_uuid(),
  static_id uuid not null references public.statics(id) on delete cascade,
  report_code text not null,
  added_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

comment on table public.static_reports is 'Links FFLogs reports to a static for aggregation.';

create index static_reports_static_id_idx on public.static_reports(static_id);
create index static_reports_report_code_idx on public.static_reports(report_code);

alter table public.static_reports enable row level security;

-- select: static members only
create policy "static_reports_select_member"
  on public.static_reports for select to authenticated
  using (
    static_id in (select id from public.statics where owner_id = auth.uid())
    or static_id in (select static_id from public.static_members where profile_id = auth.uid())
  );
-- insert: static members
create policy "static_reports_insert_member"
  on public.static_reports for insert to authenticated
  with check (
    static_id in (select id from public.statics where owner_id = auth.uid())
    or static_id in (select static_id from public.static_members where profile_id = auth.uid())
  );
-- delete: static owner only
create policy "static_reports_delete_owner"
  on public.static_reports for delete to authenticated
  using (static_id in (select id from public.statics where owner_id = auth.uid()));

-- ========== 5. aggregated_metrics ==========
create table if not exists public.aggregated_metrics (
  id uuid primary key default gen_random_uuid(),
  static_id uuid not null references public.statics(id) on delete cascade,
  encounter_id text,
  report_code text,
  metric_type text not null,
  payload jsonb not null,
  computed_at timestamptz default now()
);

comment on table public.aggregated_metrics is 'Materialized/cached aggregates per static and encounter (phase_dps, pull_count, clear_time).';

create index aggregated_metrics_static_id_idx on public.aggregated_metrics(static_id);
create index aggregated_metrics_encounter_id_idx on public.aggregated_metrics(encounter_id);

alter table public.aggregated_metrics enable row level security;

-- select: static members only
create policy "aggregated_metrics_select_member"
  on public.aggregated_metrics for select to authenticated
  using (
    static_id in (select id from public.statics where owner_id = auth.uid())
    or static_id in (select static_id from public.static_members where profile_id = auth.uid())
  );
-- insert/update: authenticated (API/service writes)
create policy "aggregated_metrics_insert_authenticated"
  on public.aggregated_metrics for insert to authenticated
  with check (true);
create policy "aggregated_metrics_update_authenticated"
  on public.aggregated_metrics for update to authenticated
  using (true);
