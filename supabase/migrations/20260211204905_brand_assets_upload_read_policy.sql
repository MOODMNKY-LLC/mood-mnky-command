-- MOOD MNKY Lab: Restore INSERT and SELECT policies for brand-assets bucket
-- Purpose: Allow authenticated users to upload to brand-assets (path: {user_id}/...)
--          and allow public read (bucket is public per BUCKET_CONFIG)
-- The auth_upload_brand_assets and public_read_brand_assets were dropped by remote_schema.
-- Upload path from lib/supabase/storage.ts: ${userId}/${fileName}

create policy "auth_upload_brand_assets" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'brand-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "public_read_brand_assets" on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'brand-assets');
