-- verse_music_playlist: Labz-configured track list for Verse audio player
-- Admin-curated; Verse side reads only
create table if not exists public.verse_music_playlist (
  id uuid primary key default gen_random_uuid(),
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(media_asset_id)
);

comment on table public.verse_music_playlist is 'Admin-curated playlist for Verse music player; public read, admin write.';

create index if not exists idx_verse_music_playlist_sort on public.verse_music_playlist(sort_order);

alter table public.verse_music_playlist enable row level security;

-- Public read for anon/authenticated (Verse consumers)
create policy "verse_music_playlist_select_public"
  on public.verse_music_playlist for select
  to anon, authenticated
  using (true);

-- Admin only: insert/update/delete
create policy "verse_music_playlist_insert_admin"
  on public.verse_music_playlist for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and (role = 'admin' or is_admin = true)
    )
  );

create policy "verse_music_playlist_update_admin"
  on public.verse_music_playlist for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and (role = 'admin' or is_admin = true)
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and (role = 'admin' or is_admin = true)
    )
  );

create policy "verse_music_playlist_delete_admin"
  on public.verse_music_playlist for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and (role = 'admin' or is_admin = true)
    )
  );
