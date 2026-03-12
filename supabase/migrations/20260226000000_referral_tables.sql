-- Referral: referral_codes (referrer's code) and referral_events (signed_up, first_order, etc.)
-- Purpose: Support referral rewards; idempotency via source_ref. All profile_id reference public.profiles(id).

-- ========== 1. referral_codes ==========
create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  code text not null,
  created_at timestamptz default now(),
  unique(code)
);

comment on table public.referral_codes is 'Unique referral codes owned by a profile (referrer).';

create index referral_codes_profile_idx on public.referral_codes(profile_id);
create index referral_codes_code_idx on public.referral_codes(code);

alter table public.referral_codes enable row level security;

create policy "referral_codes_select_own"
  on public.referral_codes for select to authenticated using (auth.uid() = profile_id);
create policy "referral_codes_insert_own"
  on public.referral_codes for insert to authenticated with check (auth.uid() = profile_id);
create policy "referral_codes_select_admin"
  on public.referral_codes for select to authenticated using (public.is_admin());

-- ========== 2. referral_events ==========
create table if not exists public.referral_events (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referee_id uuid references public.profiles(id) on delete set null,
  code_used text not null,
  event_type text not null check (event_type in ('signed_up', 'first_order')),
  source_ref text,
  reward_issued_at timestamptz,
  created_at timestamptz default now()
);

comment on table public.referral_events is 'Referral events for idempotency and reward issuance (source_ref = referee_id + event_type).';

create index referral_events_referrer_idx on public.referral_events(referrer_id);
create index referral_events_source_ref_idx on public.referral_events(source_ref);

alter table public.referral_events enable row level security;

create policy "referral_events_select_own_as_referrer"
  on public.referral_events for select to authenticated using (auth.uid() = referrer_id);
create policy "referral_events_insert_service"
  on public.referral_events for insert to authenticated with check (public.is_admin());
create policy "referral_events_select_admin"
  on public.referral_events for select to authenticated using (public.is_admin());
