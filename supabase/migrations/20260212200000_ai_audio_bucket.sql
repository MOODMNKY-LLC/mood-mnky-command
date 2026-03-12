-- MOOD MNKY Lab: Add ai-audio bucket for TTS and transcription/translation assets
-- Purpose: Store AI-generated audio from Audio Studio
-- Affected: storage.buckets, storage.objects policies

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('ai-audio', 'ai-audio', true, 26214400, array[
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac',
    'audio/flac', 'audio/webm', 'audio/mp4'
  ])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  updated_at = now();

-- RLS for storage.objects (ai-audio)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'public_read_ai_audio') then
    create policy "public_read_ai_audio" on storage.objects for select to anon, authenticated using (bucket_id = 'ai-audio');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'auth_upload_ai_audio') then
    create policy "auth_upload_ai_audio" on storage.objects for insert to authenticated
      with check (bucket_id = 'ai-audio' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'auth_delete_own_ai_audio') then
    create policy "auth_delete_own_ai_audio" on storage.objects for delete using (bucket_id = 'ai-audio' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
end
$$;
