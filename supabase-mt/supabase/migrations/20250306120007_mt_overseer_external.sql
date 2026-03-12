-- Multi-tenant Supabase (MT) — allow external auth user IDs to act as overseers.
-- Purpose: When auth is on main Supabase, main app user IDs are not in MT auth.users.
-- This table records those external user IDs that may perform overseer actions (list/update tenants).
-- Run only against the MT Supabase project.

-- =============================================================================
-- platform_owner_external_users
-- =============================================================================
create table if not exists public.platform_owner_external_users (
  external_user_id uuid primary key,
  created_at timestamptz default now()
);

comment on table public.platform_owner_external_users is 'External (e.g. main Supabase) user IDs allowed to perform overseer actions when not in MT auth.';

alter table public.platform_owner_external_users enable row level security;

-- No policies: managed via service role only (provision script or admin).
-- RLS blocks anon/authenticated from reading or writing.

-- =============================================================================
-- is_overseer(user_id): true if MT member of platform-owner tenant OR in external list
-- =============================================================================
create or replace function public.is_overseer(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select public.is_platform_owner_member(p_user_id)
     or exists (
       select 1 from public.platform_owner_external_users e where e.external_user_id = p_user_id
     );
$$;

comment on function public.is_overseer(uuid) is 'True if the user may perform overseer actions: either a member of a platform-owner tenant (MT auth) or an external user ID (e.g. main Supabase).';
