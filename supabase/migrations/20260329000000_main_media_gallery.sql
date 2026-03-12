-- Main media gallery: curated art for /main/media with AI-generated descriptions.
-- Back office manages entries; public API reads for display.

create table if not exists public.main_media_gallery (
  id uuid primary key default gen_random_uuid(),
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  sort_order int not null default 0,
  ai_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.main_media_gallery is 'Curated gallery for Main Media page; ai_description is AI-generated and can be regenerated.';
comment on column public.main_media_gallery.ai_description is '1-2 sentence description; regenerated via back office.';

create index if not exists idx_main_media_gallery_sort on public.main_media_gallery(sort_order);
create index if not exists idx_main_media_gallery_asset on public.main_media_gallery(media_asset_id);

alter table public.main_media_gallery enable row level security;

-- Public read for Main Media page
create policy "main_media_gallery_select_anon"
  on public.main_media_gallery for select
  to anon
  using (true);

create policy "main_media_gallery_select_authenticated"
  on public.main_media_gallery for select
  to authenticated
  using (true);

-- Write: service_role only (back office uses admin client)
create policy "main_media_gallery_insert_service_role"
  on public.main_media_gallery for insert
  to service_role
  with check (true);

create policy "main_media_gallery_update_service_role"
  on public.main_media_gallery for update
  to service_role
  using (true)
  with check (true);

create policy "main_media_gallery_delete_service_role"
  on public.main_media_gallery for delete
  to service_role
  using (true);
