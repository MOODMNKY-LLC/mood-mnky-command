-- MOOD MNKY Lab: Ensure media_assets table exists
-- Purpose: Create media_assets if missing (e.g. when remote schema diverged from initial migration)

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

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'media_assets' and policyname = 'media_select_own'
  ) then
    create policy "media_select_own" on public.media_assets for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'media_assets' and policyname = 'media_insert_own'
  ) then
    create policy "media_insert_own" on public.media_assets for insert with check (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'media_assets' and policyname = 'media_update_own'
  ) then
    create policy "media_update_own" on public.media_assets for update using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'media_assets' and policyname = 'media_delete_own'
  ) then
    create policy "media_delete_own" on public.media_assets for delete using (auth.uid() = user_id);
  end if;
end
$$;
