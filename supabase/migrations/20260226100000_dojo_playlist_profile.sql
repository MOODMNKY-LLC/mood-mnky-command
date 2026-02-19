-- Dojo sidebar: user's mini playlist selection (subset of verse_music_playlist)
-- Null = use full admin playlist

alter table public.profiles
  add column if not exists dojo_playlist_track_ids uuid[];

comment on column public.profiles.dojo_playlist_track_ids is 'User-selected media_asset_ids for Dojo sidebar player; null = full Verse playlist.';
