-- MOOD MNKY Lab -- Storage Buckets & Media Assets
-- Run this against your Supabase project via SQL Editor

-- ============================================================
-- 1. Create Storage Buckets
-- ============================================================

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

-- ============================================================
-- 2. RLS Policies for storage.objects
-- ============================================================

-- Public READ for public buckets
create policy "public_read_product_images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "public_read_ai_generations"
  on storage.objects for select
  using (bucket_id = 'ai-generations');

create policy "public_read_brand_assets"
  on storage.objects for select
  using (bucket_id = 'brand-assets');

create policy "public_read_user_avatars"
  on storage.objects for select
  using (bucket_id = 'user-avatars');

-- Private bucket: only owner can read their files
create policy "private_read_own_documents"
  on storage.objects for select
  using (
    bucket_id = 'private-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Authenticated UPLOAD (scoped to user's own folder)
create policy "auth_upload_product_images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "auth_upload_ai_generations"
  on storage.objects for insert
  with check (
    bucket_id = 'ai-generations'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "auth_upload_brand_assets"
  on storage.objects for insert
  with check (
    bucket_id = 'brand-assets'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "auth_upload_user_avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'user-avatars'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "auth_upload_private_documents"
  on storage.objects for insert
  with check (
    bucket_id = 'private-documents'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Authenticated UPDATE own files
create policy "auth_update_own_files"
  on storage.objects for update
  using (
    auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- DELETE: owners can delete their own files (except brand-assets)
create policy "auth_delete_own_product_images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "auth_delete_own_ai_generations"
  on storage.objects for delete
  using (
    bucket_id = 'ai-generations'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "auth_delete_own_avatars"
  on storage.objects for delete
  using (
    bucket_id = 'user-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "auth_delete_own_private_docs"
  on storage.objects for delete
  using (
    bucket_id = 'private-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- 3. Media Assets Metadata Table
-- ============================================================

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
  linked_entity_type text,  -- e.g. 'product', 'formula', 'blog_post'
  linked_entity_id text,    -- the ID of the linked entity
  public_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for efficient querying
create index if not exists idx_media_assets_user on public.media_assets(user_id);
create index if not exists idx_media_assets_bucket on public.media_assets(bucket_id);
create index if not exists idx_media_assets_tags on public.media_assets using gin(tags);
create index if not exists idx_media_assets_linked on public.media_assets(linked_entity_type, linked_entity_id);

-- Unique constraint: one metadata row per file
create unique index if not exists idx_media_assets_path on public.media_assets(bucket_id, storage_path);

alter table public.media_assets enable row level security;

-- Users can see their own assets
create policy "media_select_own"
  on public.media_assets for select
  using (auth.uid() = user_id);

-- Users can insert their own assets
create policy "media_insert_own"
  on public.media_assets for insert
  with check (auth.uid() = user_id);

-- Users can update their own assets
create policy "media_update_own"
  on public.media_assets for update
  using (auth.uid() = user_id);

-- Users can delete their own assets
create policy "media_delete_own"
  on public.media_assets for delete
  using (auth.uid() = user_id);
