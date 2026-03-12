-- Service cards bucket for Main site bundle/hero images (/main/services).
-- Public read; upload via Supabase Dashboard or API. See docs/SERVICE-CARD-ASSETS.md.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'service-cards',
  'service-cards',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  updated_at = now();

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'public_read_service_cards') then
    create policy "public_read_service_cards" on storage.objects for select to anon, authenticated
      using (bucket_id = 'service-cards');
  end if;
end
$$;
