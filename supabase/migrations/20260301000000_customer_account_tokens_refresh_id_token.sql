-- Add refresh_token and id_token to customer_account_tokens for OIDC refresh and logout.
-- refresh_token: used to obtain new access_token when expired.
-- id_token: used as id_token_hint for end_session_endpoint (logout).

alter table customer_account_tokens
  add column if not exists refresh_token text,
  add column if not exists id_token text;

comment on column customer_account_tokens.refresh_token is 'OAuth refresh token; used to get new access_token when expired.';
comment on column customer_account_tokens.id_token is 'OIDC id_token; passed as id_token_hint to end_session_endpoint on logout.';
