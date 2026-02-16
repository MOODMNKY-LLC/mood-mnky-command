-- Migration: customer_account_api
-- Purpose: Tables for Shopify Customer Account API OAuth 2.0 PKCE flow
-- Tables: customer_account_code_verifiers, customer_account_tokens

-- code_verifiers: temporary state for OAuth initiation
create table if not exists customer_account_code_verifiers (
  id uuid primary key default gen_random_uuid(),
  state text not null unique,
  verifier text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_code_verifiers_state on customer_account_code_verifiers(state);
create index if not exists idx_code_verifiers_created_at on customer_account_code_verifiers(created_at);

comment on table customer_account_code_verifiers is 'Temporary PKCE code verifiers for Customer Account API OAuth flow. Prune rows older than 10 minutes.';

-- customer_account_tokens: persisted access tokens for authenticated API requests
create table if not exists customer_account_tokens (
  id uuid primary key default gen_random_uuid(),
  shop text not null,
  access_token text not null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_customer_account_tokens_shop on customer_account_tokens(shop);
create index if not exists idx_customer_account_tokens_expires_at on customer_account_tokens(expires_at);

comment on table customer_account_tokens is 'Customer Account API access tokens. Session cookie stores token id.';

-- RLS: restrict to service role (API routes use service role)
alter table customer_account_code_verifiers enable row level security;
alter table customer_account_tokens enable row level security;

create policy "Service role only on code_verifiers" on customer_account_code_verifiers
  for all using (auth.role() = 'service_role');

create policy "Service role only on tokens" on customer_account_tokens
  for all using (auth.role() = 'service_role');
