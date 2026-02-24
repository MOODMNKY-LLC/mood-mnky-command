-- Add external_ref to reward_claims for storing Shopify discount code (or other external reference) on redemption.
alter table public.reward_claims
  add column if not exists external_ref text;

comment on column public.reward_claims.external_ref is 'External reference (e.g. Shopify discount code) when reward is redeemed.';
