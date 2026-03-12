-- MOOD MNKY Lab: Add Shopify linkage columns to media_assets
-- Purpose: Track which Shopify product/image an asset relates to for push workflow

alter table public.media_assets
  add column if not exists shopify_product_id bigint,
  add column if not exists shopify_image_id bigint;

create index if not exists idx_media_assets_shopify
  on public.media_assets(shopify_product_id, shopify_image_id)
  where shopify_product_id is not null;
