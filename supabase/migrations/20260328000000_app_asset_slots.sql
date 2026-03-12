-- App asset slots: sitemap of front-facing image placements (Main → Services, etc.).
-- Back office can upload/replace/delete per slot; app resolves slot_key → URL via media_assets.
-- See docs/SERVICE-CARD-ASSETS.md and plan Image Studio App Assets.

create table if not exists public.app_asset_slots (
  id uuid primary key default gen_random_uuid(),
  slot_key text not null unique,
  label text not null,
  category text not null,
  route_hint text,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  notion_page_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.app_asset_slots is 'Sitemap of app-facing image slots; back office uploads map to slot_key.';
comment on column public.app_asset_slots.slot_key is 'e.g. main.services.mnky-cloud';
comment on column public.app_asset_slots.category is 'e.g. main-services, main-hero';
comment on column public.app_asset_slots.media_asset_id is 'Current image; null = use fallback/placeholder';
comment on column public.app_asset_slots.notion_page_id is 'Optional Notion page for two-way sync (push URL after upload).';

create index if not exists idx_app_asset_slots_category on public.app_asset_slots(category);
create index if not exists idx_app_asset_slots_media_asset_id on public.app_asset_slots(media_asset_id);

alter table public.app_asset_slots enable row level security;

-- Read: authenticated (for back office and app server resolution)
create policy "app_asset_slots_select_authenticated"
  on public.app_asset_slots for select
  to authenticated
  using (true);

-- Public read for app (Main services page resolves URLs server-side with createClient or admin)
-- Allow anon read so server components can fetch without session when needed
create policy "app_asset_slots_select_anon"
  on public.app_asset_slots for select
  to anon
  using (true);

-- Write: service_role only (APIs use admin client)
create policy "app_asset_slots_insert_service_role"
  on public.app_asset_slots for insert
  to service_role
  with check (true);

create policy "app_asset_slots_update_service_role"
  on public.app_asset_slots for update
  to service_role
  using (true)
  with check (true);

create policy "app_asset_slots_delete_service_role"
  on public.app_asset_slots for delete
  to service_role
  using (true);

-- Seed Main → Services slots (aligned with MAIN_SERVICES ids)
insert into public.app_asset_slots (slot_key, label, category, route_hint)
values
  ('main.services.mnky-cloud', 'MNKY CLOUD', 'main-services', '/main/services'),
  ('main.services.mnky-media', 'MNKY MEDIA', 'main-services', '/main/services'),
  ('main.services.mnky-drive', 'MNKY DRIVE', 'main-services', '/main/services'),
  ('main.services.mnky-auto', 'MNKY AUTO', 'main-services', '/main/services'),
  ('main.services.mnky-agents', 'MNKY AGENTS', 'main-services', '/main/services'),
  ('main.services.mnky-games', 'MNKY GAMES', 'main-services', '/main/services'),
  ('main.services.mood-mnky-experience', 'MOOD MNKY Experience', 'main-services', '/main/services')
on conflict (slot_key) do nothing;
