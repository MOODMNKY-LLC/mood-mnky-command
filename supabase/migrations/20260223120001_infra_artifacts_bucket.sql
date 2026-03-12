-- Infra artifacts bucket for service themes, Docker files, n8n workflows.
-- Public read; uploads via publish script using service role.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'infra-artifacts',
  'infra-artifacts',
  true,
  5242880,
  array['text/css', 'text/plain', 'application/json', 'application/x-yaml', 'text/yaml', 'image/svg+xml', 'image/png', 'image/jpeg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  updated_at = now();

-- Public read so LABZ and deploy pipelines can resolve artifact URLs.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'public_read_infra_artifacts') then
    create policy "public_read_infra_artifacts" on storage.objects for select to anon, authenticated
      using (bucket_id = 'infra-artifacts');
  end if;
end
$$;
