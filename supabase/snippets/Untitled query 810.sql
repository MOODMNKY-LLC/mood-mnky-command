-- Add columns for Shopify metaobject sync (migration 20260220100000)
alter table public.fragrance_notes
  add column if not exists shopify_metaobject_id text,
  add column if not exists shopify_synced_at timestamptz;

comment on column public.fragrance_notes.shopify_metaobject_id is 'Shopify metaobject GID (e.g. gid://shopify/Metaobject/123) for fragrance_note type';
comment on column public.fragrance_notes.shopify_synced_at is 'Last time this row was synced to Shopify metaobjects';