-- Free-tier subscription: brand subscription tier and optional Stripe customer for future paid upgrade.
-- See docs/FREE-TIER-SUBSCRIPTION.md and MNKY-BOX-EDITORIAL-REFINED.md.

alter table public.profiles
  add column if not exists subscription_tier text check (subscription_tier is null or subscription_tier in ('free', 'member')),
  add column if not exists stripe_customer_id text;

comment on column public.profiles.subscription_tier is 'Brand subscription: free = free tier (drops, manga, community); member = paid/full member (future).';
comment on column public.profiles.stripe_customer_id is 'Stripe Customer ID for future paid subscription checkout; set when user joins free tier if Stripe configured.';

-- New signups get free tier by default (handle_new_user updated below).
-- Existing users claim free tier via POST /api/verse/subscription/join-free.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role text;
begin
  select case when (select count(*) from public.profiles) = 0 then 'admin' else 'pending' end
  into new_role;

  insert into public.profiles (id, display_name, full_name, avatar_url, role, email, last_sign_in_at, subscription_tier)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    new_role,
    new.email,
    new.last_sign_in_at,
    'free'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
