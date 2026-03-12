-- Manga assets bucket for issue covers and panel images.
-- Public read; uploads via API using service role (admin).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'manga-assets',
  'manga-assets',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  updated_at = now();

-- Public read so Verse reader can display cover and panel images.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'public_read_manga_assets') then
    create policy "public_read_manga_assets" on storage.objects for select to anon, authenticated
      using (bucket_id = 'manga-assets');
  end if;
end
$$;
