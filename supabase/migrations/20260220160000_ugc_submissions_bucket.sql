-- UGC submissions bucket for manga/quest photo and video uploads.
-- Private; authenticated users can upload to their own folder; service role for reads.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ugc-submissions',
  'ugc-submissions',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  updated_at = now();

-- Allow authenticated users to upload and read their own objects (path prefix = auth.uid()).
create policy "ugc_submissions_upload_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ugc-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ugc_submissions_read_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'ugc-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ugc_submissions_service_all"
  on storage.objects for all to service_role
  using (bucket_id = 'ugc-submissions')
  with check (bucket_id = 'ugc-submissions');
