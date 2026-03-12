-- Run this file once in Supabase Dashboard → SQL Editor (production project).
-- Combines: 20260216181026_verse_blog_posts.sql + 20260216185101_verse_blog_posts_author_agent.sql

-- 1) Create table + RLS
create table if not exists public.verse_blog_posts (
  id uuid primary key default gen_random_uuid(),
  notion_id text not null,
  title text not null,
  slug text not null,
  excerpt text not null default '',
  content text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  cover_url text,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (notion_id)
);

create index if not exists verse_blog_posts_slug_idx on public.verse_blog_posts (slug);
create index if not exists verse_blog_posts_status_idx on public.verse_blog_posts (status);

alter table public.verse_blog_posts enable row level security;

drop policy if exists "verse_blog_posts_select_published" on public.verse_blog_posts;
create policy "verse_blog_posts_select_published"
  on public.verse_blog_posts
  for select
  using (status = 'published');

comment on table public.verse_blog_posts is 'MNKY VERSE Blog posts synced from Notion; written by sync API (service role).';

-- 2) Add author_agent column
alter table public.verse_blog_posts
  add column if not exists author_agent text;

comment on column public.verse_blog_posts.author_agent is 'Agent identifier: mood_mnky, sage_mnky, code_mnky (from Notion Author/Agent select).';
