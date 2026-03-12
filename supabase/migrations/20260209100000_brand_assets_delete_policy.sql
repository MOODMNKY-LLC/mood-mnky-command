-- MOOD MNKY Lab: Add delete policy for brand-assets bucket
-- Purpose: Allow authenticated users to delete their own files in brand-assets

create policy "auth_delete_own_brand_assets" on storage.objects for delete
  using (bucket_id = 'brand-assets' and auth.uid()::text = (storage.foldername(name))[1]);
