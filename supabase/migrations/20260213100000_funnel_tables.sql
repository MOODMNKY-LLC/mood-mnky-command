-- MOOD MNKY Lab – funnel tables for JotForm integration
-- Purpose: Maps JotForm forms to app funnels, stores submission runs and answers
-- Affected: New tables funnel_definitions, funnel_runs, funnel_answers, funnel_events

-- ========== funnel_definitions ==========
-- Maps JotForm forms to app funnels. Admins create and manage.
create table if not exists public.funnel_definitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  provider text not null default 'jotform' check (provider in ('jotform')),
  provider_form_id text not null,
  webhook_id text,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_funnel_definitions_provider_form
  on public.funnel_definitions (provider, provider_form_id);

alter table public.funnel_definitions enable row level security;

-- Authenticated users can view active funnels (for run page); admins see all
create policy "funnel_definitions_select_authenticated"
  on public.funnel_definitions for select
  to authenticated
  using (
    status = 'active'
    or exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
    )
  );

-- Only admins can insert funnel definitions
create policy "funnel_definitions_insert_admin"
  on public.funnel_definitions for insert
  to authenticated
  with check (exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
    and profiles.role = 'admin'
  ));

-- Only admins can update funnel definitions
create policy "funnel_definitions_update_admin"
  on public.funnel_definitions for update
  to authenticated
  using (exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
    and profiles.role = 'admin'
  ));

-- Only admins can delete funnel definitions
create policy "funnel_definitions_delete_admin"
  on public.funnel_definitions for delete
  to authenticated
  using (exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
    and profiles.role = 'admin'
  ));

-- ========== funnel_runs ==========
-- Per-user run. Webhook updates via service role (bypasses RLS).
create table if not exists public.funnel_runs (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references public.funnel_definitions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'started' check (status in ('started', 'submitted', 'abandoned')),
  provider_submission_id text,
  started_at timestamptz default now(),
  submitted_at timestamptz,
  context jsonb default '{}'
);

create unique index if not exists idx_funnel_runs_provider_submission
  on public.funnel_runs (provider_submission_id)
  where provider_submission_id is not null;

create index if not exists idx_funnel_runs_funnel_user
  on public.funnel_runs (funnel_id, user_id);

create index if not exists idx_funnel_runs_user_status
  on public.funnel_runs (user_id, status)
  where user_id is not null;

alter table public.funnel_runs enable row level security;

-- Users can select their own runs
create policy "funnel_runs_select_own"
  on public.funnel_runs for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Users can insert runs for themselves (when starting)
create policy "funnel_runs_insert_own"
  on public.funnel_runs for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Users can update their own runs (e.g. abandon); webhook uses service role
create policy "funnel_runs_update_own"
  on public.funnel_runs for update
  to authenticated
  using ((select auth.uid()) = user_id);

-- ========== funnel_answers ==========
-- Normalized answers per run. Webhook inserts via service role.
create table if not exists public.funnel_answers (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.funnel_runs(id) on delete cascade,
  question_key text not null,
  answer jsonb not null default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_funnel_answers_run
  on public.funnel_answers (run_id);

alter table public.funnel_answers enable row level security;

-- Users can select answers for their own runs
create policy "funnel_answers_select_own_run"
  on public.funnel_answers for select
  to authenticated
  using (exists (
    select 1 from public.funnel_runs
    where funnel_runs.id = funnel_answers.run_id
    and funnel_runs.user_id = (select auth.uid())
  ));

-- Webhook inserts via service role; no user insert policy needed for anon
-- Allow authenticated to insert when run belongs to them (edge case: client-side?)
create policy "funnel_answers_insert_own_run"
  on public.funnel_answers for insert
  to authenticated
  with check (exists (
    select 1 from public.funnel_runs
    where funnel_runs.id = funnel_answers.run_id
    and funnel_runs.user_id = (select auth.uid())
  ));

-- ========== funnel_events ==========
-- Audit trail for webhooks and downstream actions.
create table if not exists public.funnel_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.funnel_runs(id) on delete cascade,
  type text not null check (type in ('webhook_received', 'ai_enriched', 'shopify_pushed', 'notion_synced')),
  payload jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_funnel_events_run
  on public.funnel_events (run_id);

alter table public.funnel_events enable row level security;

-- Users can select events for their own runs
create policy "funnel_events_select_own_run"
  on public.funnel_events for select
  to authenticated
  using (exists (
    select 1 from public.funnel_runs
    where funnel_runs.id = funnel_events.run_id
    and funnel_runs.user_id = (select auth.uid())
  ));

-- Webhook inserts via service role
create policy "funnel_events_insert_own_run"
  on public.funnel_events for insert
  to authenticated
  with check (exists (
    select 1 from public.funnel_runs
    where funnel_runs.id = funnel_events.run_id
    and funnel_runs.user_id = (select auth.uid())
  ));
