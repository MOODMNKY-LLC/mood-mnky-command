-- MNKY MIND: entries synced from Notion (two-way sync with MNKY_MIND Databases).
-- Notion parent: https://www.notion.so/mood-mnky/MNKY_MIND-Databases-2e1cd2a654228009920ee6fa51188f46

create table if not exists public.mnky_mind_entries (
  id uuid primary key default gen_random_uuid(),
  notion_page_id text unique,
  notion_database_id text,
  title text not null,
  category text not null default 'infra',
  content_markdown text,
  content_code text,
  source text not null default 'notion',
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.mnky_mind_entries is 'MNKY MIND: synced entries from Notion (two-way). Category e.g. infra, design, theme.';
comment on column public.mnky_mind_entries.notion_page_id is 'Notion page UUID (with or without dashes).';
comment on column public.mnky_mind_entries.notion_database_id is 'Notion database UUID this entry belongs to (e.g. Infra database under MNKY_MIND).';
comment on column public.mnky_mind_entries.content_code is 'Optional code block content (e.g. CSS, config) for display in Labz.';

create index if not exists idx_mnky_mind_entries_category on public.mnky_mind_entries (category);
create index if not exists idx_mnky_mind_entries_synced_at on public.mnky_mind_entries (synced_at desc);

alter table public.mnky_mind_entries enable row level security;

-- Only service role / admin writes; authenticated read for Labz (dashboard).
create policy "mnky_mind_select_authenticated"
  on public.mnky_mind_entries for select
  to authenticated
  using (true);

create policy "mnky_mind_insert_service_role"
  on public.mnky_mind_entries for insert
  to service_role
  with check (true);

create policy "mnky_mind_update_service_role"
  on public.mnky_mind_entries for update
  to service_role
  using (true)
  with check (true);

create policy "mnky_mind_delete_service_role"
  on public.mnky_mind_entries for delete
  to service_role
  using (true);
