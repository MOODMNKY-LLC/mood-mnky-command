-- Optional columns for syncing manga collections and issues to Shopify metaobjects.
-- Enables idempotent publish: store Shopify metaobject GID and last synced time.
-- See docs/SHOPIFY-MANGA-METAOBJECTS.md and POST /api/shopify/sync/metaobject-manga.

alter table public.mnky_collections
  add column if not exists shopify_metaobject_id text,
  add column if not exists shopify_synced_at timestamptz;

alter table public.mnky_issues
  add column if not exists shopify_metaobject_id text,
  add column if not exists shopify_synced_at timestamptz;

comment on column public.mnky_collections.shopify_metaobject_id is 'Shopify metaobject GID for mnky_collection type';
comment on column public.mnky_collections.shopify_synced_at is 'Last time this collection was synced to Shopify metaobjects';
comment on column public.mnky_issues.shopify_metaobject_id is 'Shopify metaobject GID for mnky_issue type';
comment on column public.mnky_issues.shopify_synced_at is 'Last time this issue was synced to Shopify metaobjects';
