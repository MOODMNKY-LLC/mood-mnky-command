-- Migration: deployed_services (LABZ-managed credentials) and dashboard_config (optional DB-driven dashboard).
-- Purpose: Phase 2 credentials storage per docs/SERVICES-ENV.md; dashboard section order and flags.
-- RLS: Writes via service_role only; reads for deployed_services restricted to service_role (API uses admin client).
--      dashboard_config: allow authenticated read so app can optionally read config; write via service_role.

-- ========== deployed_services ==========
-- Stores base_url and encrypted credentials per service. Decryption key in env (SERVICES_CREDENTIALS_ENCRYPTION_KEY).
create table if not exists public.deployed_services (
  id uuid primary key default gen_random_uuid(),
  service_id text not null,
  base_url text,
  encrypted_credentials_json text,
  enabled boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.deployed_services is 'LABZ-managed service credentials (encrypted). Fallback when env vars not set.';
create index if not exists idx_deployed_services_service_id on public.deployed_services (service_id);

alter table public.deployed_services enable row level security;

-- No policies for anon or authenticated: only service_role can read/write (API uses createAdminClient).
-- This keeps credentials server-only.

-- ========== dashboard_config ==========
-- Optional key-value store for dashboard section order and flags. App falls back to lib/dashboard-config.ts if empty.
create table if not exists public.dashboard_config (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz default now()
);

comment on table public.dashboard_config is 'Optional LABZ-driven dashboard config (section order, flags).';

alter table public.dashboard_config enable row level security;

-- Allow authenticated to read so dashboard can optionally use DB config.
create policy "dashboard_config_select_authenticated"
  on public.dashboard_config for select to authenticated using (true);

create policy "dashboard_config_select_anon"
  on public.dashboard_config for select to anon using (true);

-- Writes via service_role only (admin API).
