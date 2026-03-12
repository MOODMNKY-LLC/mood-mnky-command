-- Hydaelyn FFLogs augmentation: fflogs_response_cache, report_insights, user_fflogs_tokens
-- Supports table/graph/events/playerDetails/phases/rankings cache, OpenAI insights cache, optional FFLogs OAuth.

-- ========== 1. fflogs_response_cache ==========
create table if not exists public.fflogs_response_cache (
  cache_key text primary key,
  report_code text,
  kind text not null,
  payload jsonb not null,
  cached_at timestamptz not null default now()
);

comment on table public.fflogs_response_cache is 'Cached FFLogs API responses (table, graph, events, playerDetails, phases, rankings, world).';

create index fflogs_response_cache_report_code_idx on public.fflogs_response_cache(report_code) where report_code is not null;
create index fflogs_response_cache_kind_idx on public.fflogs_response_cache(kind);
create index fflogs_response_cache_cached_at_idx on public.fflogs_response_cache(cached_at desc);

alter table public.fflogs_response_cache enable row level security;

-- authenticated read/write for API routes that run as authenticated user
create policy "fflogs_response_cache_select_authenticated"
  on public.fflogs_response_cache for select to authenticated
  using (true);
create policy "fflogs_response_cache_insert_authenticated"
  on public.fflogs_response_cache for insert to authenticated
  with check (true);
create policy "fflogs_response_cache_update_authenticated"
  on public.fflogs_response_cache for update to authenticated
  using (true);
create policy "fflogs_response_cache_delete_authenticated"
  on public.fflogs_response_cache for delete to authenticated
  using (true);

-- ========== 2. report_insights ==========
create table if not exists public.report_insights (
  id uuid primary key default gen_random_uuid(),
  report_code text not null,
  static_id uuid references public.statics(id) on delete set null,
  type text not null,
  input_hash text not null,
  content jsonb,
  model_used text,
  created_at timestamptz not null default now()
);

comment on table public.report_insights is 'Cached OpenAI-generated insights (summary, briefing, coaching, parse_explanation, anomaly).';

create index report_insights_report_code_idx on public.report_insights(report_code);
create index report_insights_static_id_idx on public.report_insights(static_id) where static_id is not null;
create index report_insights_input_hash_idx on public.report_insights(input_hash);
create index report_insights_created_at_idx on public.report_insights(created_at desc);

alter table public.report_insights enable row level security;

-- select: static members if static_id set; else any authenticated (report_code is public)
create policy "report_insights_select_member_or_public"
  on public.report_insights for select to authenticated
  using (
    static_id is null
    or static_id in (select id from public.statics where owner_id = auth.uid())
    or static_id in (select static_id from public.static_members where profile_id = auth.uid())
  );
-- insert/update: authenticated (API writes)
create policy "report_insights_insert_authenticated"
  on public.report_insights for insert to authenticated
  with check (true);
create policy "report_insights_update_authenticated"
  on public.report_insights for update to authenticated
  using (true);

-- ========== 3. user_fflogs_tokens (optional FFLogs OAuth) ==========
create table if not exists public.user_fflogs_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id)
);

comment on table public.user_fflogs_tokens is 'FFLogs OAuth tokens for private/unlisted report access.';

create index user_fflogs_tokens_profile_id_idx on public.user_fflogs_tokens(profile_id);

alter table public.user_fflogs_tokens enable row level security;

-- users see only their own token
create policy "user_fflogs_tokens_select_own"
  on public.user_fflogs_tokens for select to authenticated
  using (profile_id = auth.uid());
create policy "user_fflogs_tokens_insert_own"
  on public.user_fflogs_tokens for insert to authenticated
  with check (profile_id = auth.uid());
create policy "user_fflogs_tokens_update_own"
  on public.user_fflogs_tokens for update to authenticated
  using (profile_id = auth.uid());
create policy "user_fflogs_tokens_delete_own"
  on public.user_fflogs_tokens for delete to authenticated
  using (profile_id = auth.uid());
