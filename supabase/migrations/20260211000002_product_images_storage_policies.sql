-- MOOD MNKY Lab: Restore INSERT, SELECT, DELETE policies for product-images bucket
-- Same issue as brand-assets: remote_schema dropped these policies.
-- Upload path from lib/supabase/storage.ts: ${userId}/${fileName}

create policy "auth_upload_product_images" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "public_read_product_images" on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'product-images');

create policy "auth_delete_own_product_images" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
