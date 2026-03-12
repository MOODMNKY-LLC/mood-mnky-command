-- Media assets: audio metadata (title, artist, album) and cover art for verse tracks
alter table public.media_assets
  add column if not exists audio_title text,
  add column if not exists audio_artist text,
  add column if not exists audio_album text,
  add column if not exists cover_art_path text,
  add column if not exists cover_art_url text;

comment on column public.media_assets.audio_title is 'Extracted from ID3/Vorbis/MP4 tags';
comment on column public.media_assets.audio_artist is 'Extracted from ID3/Vorbis/MP4 tags';
comment on column public.media_assets.audio_album is 'Extracted from ID3/Vorbis/MP4 tags';
comment on column public.media_assets.cover_art_path is 'Storage path for extracted cover art';
comment on column public.media_assets.cover_art_url is 'Public URL for cover art';
