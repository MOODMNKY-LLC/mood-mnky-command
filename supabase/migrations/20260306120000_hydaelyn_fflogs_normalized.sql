-- Hydaelyn: normalized FFLogs tables for import pipeline, custom analytics, and Discord reports.
-- User-scoped: reports and jobs tied to profile_id. Realtime enabled for summaries and jobs.

-- ========== 1. fflogs_reports ==========
create table if not exists public.fflogs_reports (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  code text not null,
  title text,
  region text,
  zone_id int,
  start_time_ms bigint,
  end_time_ms bigint,
  fetched_at timestamptz not null default now(),
  raw jsonb,
  unique(profile_id, code)
);

comment on table public.fflogs_reports is 'Imported FFLogs reports (header + fights) for custom analytics and AI.';

create index fflogs_reports_code_idx on public.fflogs_reports(code);
create index fflogs_reports_profile_start_idx on public.fflogs_reports(profile_id, start_time_ms desc);

alter table public.fflogs_reports enable row level security;

create policy "fflogs_reports_select_own"
  on public.fflogs_reports for select to authenticated
  using (profile_id = auth.uid());
create policy "fflogs_reports_insert_own"
  on public.fflogs_reports for insert to authenticated
  with check (profile_id = auth.uid());
create policy "fflogs_reports_update_own"
  on public.fflogs_reports for update to authenticated
  using (profile_id = auth.uid());
create policy "fflogs_reports_delete_own"
  on public.fflogs_reports for delete to authenticated
  using (profile_id = auth.uid());

-- ========== 2. fflogs_fights ==========
create table if not exists public.fflogs_fights (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.fflogs_reports(id) on delete cascade,
  fight_id int not null,
  encounter_id int,
  name text,
  kill boolean,
  start_time_ms bigint,
  end_time_ms bigint,
  duration_ms bigint,
  raw jsonb,
  unique(report_id, fight_id)
);

comment on table public.fflogs_fights is 'Fight/encounter segments within an imported report.';

create index fflogs_fights_report_id_idx on public.fflogs_fights(report_id);
create index fflogs_fights_start_idx on public.fflogs_fights(report_id, start_time_ms);

alter table public.fflogs_fights enable row level security;

create policy "fflogs_fights_select_own"
  on public.fflogs_fights for select to authenticated
  using (report_id in (select id from public.fflogs_reports where profile_id = auth.uid()));
create policy "fflogs_fights_insert_own"
  on public.fflogs_fights for insert to authenticated
  with check (report_id in (select id from public.fflogs_reports where profile_id = auth.uid()));
create policy "fflogs_fights_update_own"
  on public.fflogs_fights for update to authenticated
  using (report_id in (select id from public.fflogs_reports where profile_id = auth.uid()));
create policy "fflogs_fights_delete_own"
  on public.fflogs_fights for delete to authenticated
  using (report_id in (select id from public.fflogs_reports where profile_id = auth.uid()));

-- ========== 3. fflogs_fight_summaries ==========
create table if not exists public.fflogs_fight_summaries (
  fight_id uuid primary key references public.fflogs_fights(id) on delete cascade,
  party_dps numeric,
  party_hps numeric,
  deaths int,
  damage_taken numeric,
  summary jsonb,
  computed_at timestamptz not null default now()
);

comment on table public.fflogs_fight_summaries is 'Per-fight rollups and FightContext for UI and Discord. Realtime published.';

create index fflogs_fight_summaries_computed_at_idx on public.fflogs_fight_summaries(computed_at desc);

alter table public.fflogs_fight_summaries enable row level security;

create policy "fflogs_fight_summaries_select_own"
  on public.fflogs_fight_summaries for select to authenticated
  using (fight_id in (
    select f.id from public.fflogs_fights f
    join public.fflogs_reports r on r.id = f.report_id
    where r.profile_id = auth.uid()
  ));
create policy "fflogs_fight_summaries_insert_own"
  on public.fflogs_fight_summaries for insert to authenticated
  with check (fight_id in (
    select f.id from public.fflogs_fights f
    join public.fflogs_reports r on r.id = f.report_id
    where r.profile_id = auth.uid()
  ));
create policy "fflogs_fight_summaries_update_own"
  on public.fflogs_fight_summaries for update to authenticated
  using (fight_id in (
    select f.id from public.fflogs_fights f
    join public.fflogs_reports r on r.id = f.report_id
    where r.profile_id = auth.uid()
  ));

-- ========== 4. fflogs_player_fight_metrics ==========
create table if not exists public.fflogs_player_fight_metrics (
  id uuid primary key default gen_random_uuid(),
  fight_id uuid not null references public.fflogs_fights(id) on delete cascade,
  actor_id int not null,
  actor_name text,
  job text,
  rdps numeric,
  adps numeric,
  ndps numeric,
  hps numeric,
  deaths int,
  damage_taken numeric,
  perf jsonb,
  computed_at timestamptz not null default now(),
  unique(fight_id, actor_id)
);

comment on table public.fflogs_player_fight_metrics is 'Per-player per-fight metrics (rdps, hps, deaths) for analytics and FightContext.';

create index fflogs_player_fight_metrics_fight_id_idx on public.fflogs_player_fight_metrics(fight_id);
create index fflogs_player_fight_metrics_rdps_idx on public.fflogs_player_fight_metrics(fight_id, rdps desc nulls last);

alter table public.fflogs_player_fight_metrics enable row level security;

create policy "fflogs_player_fight_metrics_select_own"
  on public.fflogs_player_fight_metrics for select to authenticated
  using (fight_id in (
    select f.id from public.fflogs_fights f
    join public.fflogs_reports r on r.id = f.report_id
    where r.profile_id = auth.uid()
  ));
create policy "fflogs_player_fight_metrics_insert_own"
  on public.fflogs_player_fight_metrics for insert to authenticated
  with check (fight_id in (
    select f.id from public.fflogs_fights f
    join public.fflogs_reports r on r.id = f.report_id
    where r.profile_id = auth.uid()
  ));
create policy "fflogs_player_fight_metrics_update_own"
  on public.fflogs_player_fight_metrics for update to authenticated
  using (fight_id in (
    select f.id from public.fflogs_fights f
    join public.fflogs_reports r on r.id = f.report_id
    where r.profile_id = auth.uid()
  ));

-- ========== 5. fflogs_import_jobs ==========
create table if not exists public.fflogs_import_jobs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  report_code text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed')),
  fight_ids jsonb not null default '[]',
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.fflogs_import_jobs is 'Import queue: one row per report import; status and fight_ids drive worker and UI progress.';

create index fflogs_import_jobs_profile_status_idx on public.fflogs_import_jobs(profile_id, status);
create index fflogs_import_jobs_created_at_idx on public.fflogs_import_jobs(created_at desc);

alter table public.fflogs_import_jobs enable row level security;

create policy "fflogs_import_jobs_select_own"
  on public.fflogs_import_jobs for select to authenticated
  using (profile_id = auth.uid());
create policy "fflogs_import_jobs_insert_own"
  on public.fflogs_import_jobs for insert to authenticated
  with check (profile_id = auth.uid());
create policy "fflogs_import_jobs_update_own"
  on public.fflogs_import_jobs for update to authenticated
  using (profile_id = auth.uid());

-- ========== Realtime publication ==========
alter publication supabase_realtime add table public.fflogs_fight_summaries;
alter publication supabase_realtime add table public.fflogs_import_jobs;
