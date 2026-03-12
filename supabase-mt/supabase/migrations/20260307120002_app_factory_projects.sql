-- =============================================================================
-- App Factory: projects
-- Purpose: Single application initiative for a customer. Linked to tenant for
--   RLS; optional customer_id for grouping. platform_admin and tenant members
--   can access their tenant''s projects.
-- =============================================================================

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  name text not null,
  slug text not null,
  template_id uuid not null references public.template_registry(id) on delete restrict,
  template_version_id uuid not null references public.template_versions(id) on delete restrict,
  deployment_model text not null default 'dedicated_app_shared_host' check (
    deployment_model in ('shared_multi_tenant', 'dedicated_app_shared_host', 'dedicated_runtime')
  ),
  hosting_tier text not null default 'standard',
  supabase_strategy text not null default 'shared_rls' check (
    supabase_strategy in ('shared_rls', 'shared_schema', 'dedicated_project')
  ),
  status text not null default 'draft' check (
    status in ('draft', 'validated', 'generated', 'provisioned', 'deployed', 'healthy', 'handed_off', 'failed')
  ),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tenant_id, slug)
);

comment on table public.projects is 'Application initiative for app factory; scoped to tenant for RLS.';
comment on column public.projects.deployment_model is 'shared_multi_tenant | dedicated_app_shared_host | dedicated_runtime.';
comment on column public.projects.supabase_strategy is 'shared_rls | shared_schema | dedicated_project.';
comment on column public.projects.status is 'draft -> validated -> generated -> provisioned -> deployed -> healthy -> handed_off | failed.';

create index idx_projects_tenant_id on public.projects(tenant_id);
create index idx_projects_customer_id on public.projects(customer_id);
create index idx_projects_status on public.projects(status);

alter table public.projects enable row level security;

-- Tenant members can select their tenant''s projects; platform_admin sees all.
create policy "projects_select_tenant_or_platform_admin"
  on public.projects for select
  to authenticated
  using (
    public.is_tenant_member(tenant_id, auth.uid())
    or public.is_platform_admin(auth.uid())
  );

-- Tenant admins can insert for their tenant; platform_admin can insert any.
create policy "projects_insert_tenant_admin_or_platform_admin"
  on public.projects for insert
  to authenticated
  with check (
    public.is_tenant_admin(tenant_id, auth.uid())
    or public.is_platform_admin(auth.uid())
  );

create policy "projects_update_tenant_admin_or_platform_admin"
  on public.projects for update
  to authenticated
  using (
    public.is_tenant_admin(tenant_id, auth.uid())
    or public.is_platform_admin(auth.uid())
  )
  with check (
    public.is_tenant_admin(tenant_id, auth.uid())
    or public.is_platform_admin(auth.uid())
  );

create policy "projects_delete_tenant_admin_or_platform_admin"
  on public.projects for delete
  to authenticated
  using (
    public.is_tenant_admin(tenant_id, auth.uid())
    or public.is_platform_admin(auth.uid())
  );
