-- MOOD MNKY Lab: Add DELETE policy for product-images bucket
-- Allows authenticated users to delete their own files (path starts with user_id)

create policy "auth_delete_own_product_images" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
