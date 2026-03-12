-- MOOD MNKY Lab Database Schema
-- Run this against your Supabase project

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text default 'member' check (role in ('admin', 'member', 'viewer')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Saved blends table
create table if not exists public.saved_blends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  product_type text not null,
  batch_weight_g numeric not null,
  fragrance_load_pct numeric not null,
  fragrances jsonb not null default '[]',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.saved_blends enable row level security;

create policy "blends_select_own" on public.saved_blends for select using (auth.uid() = user_id);
create policy "blends_insert_own" on public.saved_blends for insert with check (auth.uid() = user_id);
create policy "blends_update_own" on public.saved_blends for update using (auth.uid() = user_id);
create policy "blends_delete_own" on public.saved_blends for delete using (auth.uid() = user_id);

-- Product drafts table (tracks products pushed to Shopify)
create table if not exists public.product_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shopify_product_id bigint,
  name text not null,
  fragrance_oil_id text,
  formula_id text,
  container_id text,
  price numeric,
  cost numeric,
  status text default 'draft' check (status in ('draft', 'pushed', 'published', 'archived')),
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.product_drafts enable row level security;

create policy "drafts_select_own" on public.product_drafts for select using (auth.uid() = user_id);
create policy "drafts_insert_own" on public.product_drafts for insert with check (auth.uid() = user_id);
create policy "drafts_update_own" on public.product_drafts for update using (auth.uid() = user_id);
create policy "drafts_delete_own" on public.product_drafts for delete using (auth.uid() = user_id);

-- Sync logs table (tracks Notion and Shopify sync history)
create table if not exists public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('notion', 'shopify')),
  entity_type text not null,
  records_synced int default 0,
  status text default 'success' check (status in ('success', 'partial', 'error')),
  error_message text,
  synced_at timestamptz default now()
);

-- sync_logs readable by authenticated users, writable by service role only
alter table public.sync_logs enable row level security;
create policy "sync_logs_select_authenticated" on public.sync_logs for select using (auth.role() = 'authenticated');
