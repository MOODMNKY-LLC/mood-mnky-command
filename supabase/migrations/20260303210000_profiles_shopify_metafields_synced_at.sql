-- Track last sync of shopper profile data to Shopify customer metafields.
-- Used for staleness indicator and optional "Sync now" in Dojo preferences.

alter table public.profiles
  add column if not exists shopify_metafields_synced_at timestamptz;

comment on column public.profiles.shopify_metafields_synced_at is 'When display_name, bio, handle were last synced to Shopify customer metafields. Null if never synced.';
