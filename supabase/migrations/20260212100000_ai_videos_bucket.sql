-- MOOD MNKY Lab: Add ai-videos bucket for Sora-generated videos
-- Purpose: Store Sora-generated MP4 videos from Video Studio
-- Affected: storage.buckets, storage.objects policies

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('ai-videos', 'ai-videos', true, 52428800, array['video/mp4'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  updated_at = now();

-- RLS for storage.objects (ai-videos)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'public_read_ai_videos') then
    create policy "public_read_ai_videos" on storage.objects for select to anon, authenticated using (bucket_id = 'ai-videos');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'auth_upload_ai_videos') then
    create policy "auth_upload_ai_videos" on storage.objects for insert to authenticated
      with check (bucket_id = 'ai-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'auth_delete_own_ai_videos') then
    create policy "auth_delete_own_ai_videos" on storage.objects for delete using (bucket_id = 'ai-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
end
$$;
