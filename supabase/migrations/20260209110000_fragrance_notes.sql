-- MNKY Lab: Fragrance Notes glossary table
-- Purpose: Stores fragrance note definitions (description, olfactive profile, facts).
-- Used for the glossary page and linking from fragrance oil notes.
-- "Products with X" derived at query time from fragrance_oils note arrays.

create table if not exists public.fragrance_notes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description_short text default '',
  olfactive_profile text default '',
  facts text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_fragrance_notes_slug on public.fragrance_notes(slug);
create index if not exists idx_fragrance_notes_name on public.fragrance_notes(name);
create index if not exists idx_fragrance_notes_name_prefix on public.fragrance_notes(lower(left(name, 1)));

alter table public.fragrance_notes enable row level security;

create policy "fragrance_notes_select_authenticated"
  on public.fragrance_notes
  for select
  using (auth.role() = 'authenticated');
