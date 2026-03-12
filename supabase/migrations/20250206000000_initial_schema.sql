-- MOOD MNKY Lab – initial schema (profiles, saved_blends, product_drafts, sync_logs, storage, media_assets)
-- Generated from scripts/001_create_schema.sql + scripts/002_storage_setup.sql

-- ========== 001_create_schema ==========

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

alter table public.sync_logs enable row level security;
create policy "sync_logs_select_authenticated" on public.sync_logs for select using (auth.role() = 'authenticated');

-- ========== 002_storage_setup ==========

-- Storage Buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images',   'product-images',   true,  10485760,  array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']),
  ('ai-generations',   'ai-generations',   true,  26214400,  array['image/jpeg','image/png','image/webp']),
  ('brand-assets',     'brand-assets',     true,  26214400,  array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','video/mp4','video/webm','application/pdf']),
  ('user-avatars',     'user-avatars',     true,  2097152,   array['image/jpeg','image/png','image/webp']),
  ('private-documents','private-documents',false, 52428800,  null)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- RLS for storage.objects
create policy "public_read_product_images" on storage.objects for select using (bucket_id = 'product-images');
create policy "public_read_ai_generations" on storage.objects for select using (bucket_id = 'ai-generations');
create policy "public_read_brand_assets" on storage.objects for select using (bucket_id = 'brand-assets');
create policy "public_read_user_avatars" on storage.objects for select using (bucket_id = 'user-avatars');
create policy "private_read_own_documents" on storage.objects for select
  using (bucket_id = 'private-documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "auth_upload_product_images" on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.role() = 'authenticated' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "auth_upload_ai_generations" on storage.objects for insert
  with check (bucket_id = 'ai-generations' and auth.role() = 'authenticated' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "auth_upload_brand_assets" on storage.objects for insert
  with check (bucket_id = 'brand-assets' and auth.role() = 'authenticated' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "auth_upload_user_avatars" on storage.objects for insert
  with check (bucket_id = 'user-avatars' and auth.role() = 'authenticated' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "auth_upload_private_documents" on storage.objects for insert
  with check (bucket_id = 'private-documents' and auth.role() = 'authenticated' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "auth_update_own_files" on storage.objects for update
  using (auth.role() = 'authenticated' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "auth_delete_own_product_images" on storage.objects for delete using (bucket_id = 'product-images' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "auth_delete_own_ai_generations" on storage.objects for delete using (bucket_id = 'ai-generations' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "auth_delete_own_avatars" on storage.objects for delete using (bucket_id = 'user-avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "auth_delete_own_private_docs" on storage.objects for delete using (bucket_id = 'private-documents' and auth.uid()::text = (storage.foldername(name))[1]);

-- Media assets metadata table
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket_id text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  width int,
  height int,
  tags text[] default '{}',
  alt_text text,
  description text,
  linked_entity_type text,
  linked_entity_id text,
  public_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_media_assets_user on public.media_assets(user_id);
create index if not exists idx_media_assets_bucket on public.media_assets(bucket_id);
create index if not exists idx_media_assets_tags on public.media_assets using gin(tags);
create index if not exists idx_media_assets_linked on public.media_assets(linked_entity_type, linked_entity_id);
create unique index if not exists idx_media_assets_path on public.media_assets(bucket_id, storage_path);

alter table public.media_assets enable row level security;
create policy "media_select_own" on public.media_assets for select using (auth.uid() = user_id);
create policy "media_insert_own" on public.media_assets for insert with check (auth.uid() = user_id);
create policy "media_update_own" on public.media_assets for update using (auth.uid() = user_id);
create policy "media_delete_own" on public.media_assets for delete using (auth.uid() = user_id);
