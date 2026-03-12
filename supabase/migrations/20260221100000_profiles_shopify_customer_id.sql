-- Add shopify_customer_id to profiles for order→XP linkage.
-- Webhook orders/paid looks up profile by this to award XP; can be set when
-- linking Shopify customer (e.g. Customer Account API or admin sync).

alter table public.profiles
  add column if not exists shopify_customer_id text;

comment on column public.profiles.shopify_customer_id is 'Shopify Customer GID or numeric ID; used by orders/paid webhook to resolve profile for XP.';

create unique index if not exists profiles_shopify_customer_id_key
  on public.profiles (shopify_customer_id)
  where shopify_customer_id is not null;
