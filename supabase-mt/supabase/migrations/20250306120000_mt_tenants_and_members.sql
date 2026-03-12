-- Multi-tenant Supabase (MT) project — core tenant and membership tables.
-- Purpose: tenants (brands/workspaces) and tenant_members (user membership + role).
-- Run this migration only against the MT Supabase project.

-- =============================================================================
-- tenants
-- =============================================================================
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  settings jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.tenants is 'Tenants (brands/workspaces) in the MOOD MNKY ecosystem.';
comment on column public.tenants.slug is 'Unique URL-safe identifier (e.g. mood-mnky, default).';
comment on column public.tenants.status is 'Lifecycle state: active, suspended, archived.';

alter table public.tenants enable row level security;

-- (Tenants select policy added after tenant_members exists, below.)

-- =============================================================================
-- tenant_members
-- =============================================================================
create table if not exists public.tenant_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, tenant_id)
);

comment on table public.tenant_members is 'User membership in tenants; role determines permissions within tenant.';
create index if not exists idx_tenant_members_tenant_id on public.tenant_members(tenant_id);
create index if not exists idx_tenant_members_user_id on public.tenant_members(user_id);

alter table public.tenant_members enable row level security;

-- Users can read their own memberships.
create policy "tenant_members_select_own"
  on public.tenant_members for select
  to authenticated
  using (user_id = auth.uid());

-- Insert/update/delete: only via service role or RPC that checks tenant admin (handled in app).
create policy "tenant_members_insert_service"
  on public.tenant_members for insert
  to authenticated
  with check (false);
create policy "tenant_members_update_service"
  on public.tenant_members for update
  to authenticated
  using (false);
create policy "tenant_members_delete_service"
  on public.tenant_members for delete
  to authenticated
  using (false);

-- =============================================================================
-- tenants: select policy (members can read their tenant)
-- =============================================================================
create policy "tenants_select_member"
  on public.tenants for select
  to authenticated
  using (
    id in (
      select tm.tenant_id from public.tenant_members tm where tm.user_id = auth.uid()
    )
  );
