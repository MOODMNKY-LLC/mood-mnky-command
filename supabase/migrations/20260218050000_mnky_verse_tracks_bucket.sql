-- MNKY Verse Tracks: bucket for user-uploaded audio (Suno, etc.)
-- Purpose: Store uploaded audio tracks for Verse and Labz
-- Affected: storage.buckets, storage.objects policies

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('mnky-verse-tracks', 'mnky-verse-tracks', true, 52428800, array[
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg',
    'audio/aac', 'audio/flac', 'audio/webm', 'audio/mp4', 'audio/x-m4a',
    'video/mp4'
  ])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  updated_at = now();

-- RLS for storage.objects (mnky-verse-tracks)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'public_read_mnky_verse_tracks') then
    create policy "public_read_mnky_verse_tracks" on storage.objects for select to anon, authenticated using (bucket_id = 'mnky-verse-tracks');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'auth_upload_mnky_verse_tracks') then
    create policy "auth_upload_mnky_verse_tracks" on storage.objects for insert to authenticated
      with check (bucket_id = 'mnky-verse-tracks' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'auth_delete_own_mnky_verse_tracks') then
    create policy "auth_delete_own_mnky_verse_tracks" on storage.objects for delete using (bucket_id = 'mnky-verse-tracks' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
end
$$;
