-- Add profile_id to customer_account_code_verifiers so the OAuth handshake is tied to the Supabase user.
-- Enables callback to verify the authenticated user matches the user who started the link flow.

alter table customer_account_code_verifiers
  add column if not exists profile_id uuid references auth.users(id) on delete set null;

create index if not exists idx_code_verifiers_profile_id on customer_account_code_verifiers(profile_id);

comment on column customer_account_code_verifiers.profile_id is 'Supabase user who started the link flow; validated in callback.';
