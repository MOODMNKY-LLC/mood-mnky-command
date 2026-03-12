-- Multi-tenant Supabase (MT) — RLS helper functions.
-- Purpose: is_tenant_member and is_tenant_admin for use in RLS policies on tenant-scoped tables.
-- Run only against the MT Supabase project.

set search_path = '';

-- Returns true if the given user is a member of the given tenant.
create or replace function public.is_tenant_member(p_tenant_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = p_tenant_id and tm.user_id = p_user_id
  );
$$;

comment on function public.is_tenant_member(uuid, uuid) is 'True if p_user_id is a member of tenant p_tenant_id; for RLS.';

-- Returns true if the given user is owner or admin of the given tenant.
create or replace function public.is_tenant_admin(p_tenant_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = p_tenant_id and tm.user_id = p_user_id and tm.role in ('owner', 'admin')
  );
$$;

comment on function public.is_tenant_admin(uuid, uuid) is 'True if p_user_id is owner or admin of tenant p_tenant_id; for RLS.';
