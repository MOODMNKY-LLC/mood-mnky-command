-- Add profile_id to customer_account_tokens for server-side "on behalf of" usage.
-- Enables: get token by profile_id (and shop), one-token-per-profile-per-shop policy.

alter table customer_account_tokens
  add column if not exists profile_id uuid references auth.users(id) on delete set null;

create index if not exists idx_customer_account_tokens_profile_id
  on customer_account_tokens(profile_id);

comment on column customer_account_tokens.profile_id is 'Supabase user (profile) who owns this token; used for server-side API-on-behalf-of and unlink by user.';
