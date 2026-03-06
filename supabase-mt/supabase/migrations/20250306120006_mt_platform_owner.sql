-- Multi-tenant Supabase (MT) — platform owner (overseer) tenant support.
-- Purpose: Mark one tenant as platform owner; its members may list and manage other tenants.
-- Run only against the MT Supabase project.

-- =============================================================================
-- tenants: is_platform_owner
-- =============================================================================
alter table public.tenants
  add column if not exists is_platform_owner boolean not null default false;

comment on column public.tenants.is_platform_owner is 'When true, members of this tenant may list and manage other tenants (overseer).';

-- =============================================================================
-- Helper: is_platform_owner_tenant(tenant_id)
-- =============================================================================
create or replace function public.is_platform_owner_tenant(p_tenant_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (select t.is_platform_owner from public.tenants t where t.id = p_tenant_id),
    false
  );
$$;

comment on function public.is_platform_owner_tenant(uuid) is 'True if the tenant is marked as platform owner (overseer).';

-- =============================================================================
-- Helper: is_platform_owner_member(user_id)
-- =============================================================================
create or replace function public.is_platform_owner_member(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.tenant_members tm
    join public.tenants t on t.id = tm.tenant_id and t.is_platform_owner = true
    where tm.user_id = p_user_id
  );
$$;

comment on function public.is_platform_owner_member(uuid) is 'True if the user is a member of any tenant where is_platform_owner = true.';
