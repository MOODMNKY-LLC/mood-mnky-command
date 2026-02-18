-- Assistant knowledge: content synced from Notion for storefront AI (FAQ, About, policies, etc.)
-- Written by POST /api/notion/sync/assistant-knowledge (service role).

create table if not exists public.assistant_knowledge (
  id uuid primary key default gen_random_uuid(),
  notion_id text not null,
  title text not null,
  content text not null default '',
  source text not null default 'general' check (source in ('faq', 'about', 'shipping', 'policies', 'general')),
  updated_at timestamptz default now(),
  unique (notion_id)
);

create index if not exists assistant_knowledge_source_idx on public.assistant_knowledge (source);

-- Full-text search on title + content
create index if not exists assistant_knowledge_search_idx
  on public.assistant_knowledge
  using gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

alter table public.assistant_knowledge enable row level security;

-- Allow public read for storefront assistant (uses service role in API, but RLS allows anon if needed)
drop policy if exists "assistant_knowledge_select_all" on public.assistant_knowledge;
create policy "assistant_knowledge_select_all"
  on public.assistant_knowledge
  for select
  using (true);

comment on table public.assistant_knowledge is 'Knowledge base for MNKY storefront assistant; synced from Notion.';
