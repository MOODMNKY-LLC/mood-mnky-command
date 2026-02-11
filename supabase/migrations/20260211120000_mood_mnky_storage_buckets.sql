-- MOOD MNKY Lab: Ensure required storage buckets exist in production
-- Purpose: Production has buckets from a different schema (MNKY-VERSE); MOOD MNKY Lab
--          expects product-images, ai-generations, brand-assets, user-avatars, private-documents.
--          This migration creates them if missing. Idempotent via ON CONFLICT.
-- Affected: storage.buckets

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images',   'product-images',   true,  10485760,  array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']),
  ('ai-generations',   'ai-generations',   true,  26214400,  array['image/jpeg','image/png','image/webp']),
  ('brand-assets',     'brand-assets',     true,  26214400,  array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','video/mp4','video/webm','application/pdf']),
  ('user-avatars',     'user-avatars',     true,  2097152,   array['image/jpeg','image/png','image/webp']),
  ('private-documents','private-documents',false, 52428800,  null)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  updated_at = now();
