-- MNKY Lab: Fragrance Oils table
-- Purpose: Stores MNKY Science fragrance oil catalog synced from Notion.
-- Notion is the editable source of truth; this table is the rendered source for the app.
-- Affected: Replaces public.fragrance_oils (drops existing schema, creates Notion-sync schema)

-- Drop existing fragrance_oils (from remote_schema) and its foreign key constraints
drop table if exists public.fragrance_oils cascade;

-- fragrance_oils: catalog of fragrance oils from MNKY Science (Notion source)
create table public.fragrance_oils (
  id uuid primary key default gen_random_uuid(),
  notion_id text not null unique,
  name text not null,
  description text default '',
  family text default '',
  type text default 'Fragrance Oil',
  subfamilies text[] default '{}',
  top_notes text[] default '{}',
  middle_notes text[] default '{}',
  base_notes text[] default '{}',
  alternative_branding text[] default '{}',
  blends_well_with text[] default '{}',
  suggested_colors text[] default '{}',
  candle_safe boolean default true,
  soap_safe boolean default false,
  lotion_safe boolean default false,
  perfume_safe boolean default false,
  room_spray_safe boolean default false,
  wax_melt_safe boolean default false,
  max_usage_candle numeric default 0,
  max_usage_soap numeric default 0,
  max_usage_lotion numeric default 0,
  price_1oz numeric default 0,
  price_4oz numeric default 0,
  price_16oz numeric default 0,
  rating numeric default 0,
  review_count numeric default 0,
  allergen_statement text,
  notion_url text,
  last_edited_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_fragrance_oils_notion_id on public.fragrance_oils(notion_id);
create index if not exists idx_fragrance_oils_family on public.fragrance_oils(family);
create index if not exists idx_fragrance_oils_name on public.fragrance_oils(name);

-- RLS: authenticated users can read; sync API uses service_role (bypasses RLS) for upsert
alter table public.fragrance_oils enable row level security;

-- Allow authenticated users to select fragrance oils for app display
create policy "fragrance_oils_select_authenticated"
  on public.fragrance_oils
  for select
  using (auth.role() = 'authenticated');
