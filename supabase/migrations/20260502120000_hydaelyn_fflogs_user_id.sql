-- Hydaelyn: add fflogs_user_id to user_fflogs_tokens for Sign-in-with-FFLogs lookup.
-- Enables finding profile_id by FFLogs user id when completing OAuth callback (signin intent).
-- SAFE: additive only.

alter table public.user_fflogs_tokens
  add column if not exists fflogs_user_id text;

comment on column public.user_fflogs_tokens.fflogs_user_id is 'FFLogs user id from OAuth; unique so we can look up profile for Sign in with FFLogs.';

create unique index if not exists user_fflogs_tokens_fflogs_user_id_key
  on public.user_fflogs_tokens(fflogs_user_id)
  where fflogs_user_id is not null;
