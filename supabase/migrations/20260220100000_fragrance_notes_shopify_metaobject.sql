-- Optional columns for Syncing fragrance_notes to Shopify metaobjects (Phase 2 LABZ).
-- Enables incremental sync: store Shopify metaobject GID and last synced time.

alter table public.fragrance_notes
  add column if not exists shopify_metaobject_id text,
  add column if not exists shopify_synced_at timestamptz;

comment on column public.fragrance_notes.shopify_metaobject_id is 'Shopify metaobject GID (e.g. gid://shopify/Metaobject/123) for fragrance_note type';
comment on column public.fragrance_notes.shopify_synced_at is 'Last time this row was synced to Shopify metaobjects';
