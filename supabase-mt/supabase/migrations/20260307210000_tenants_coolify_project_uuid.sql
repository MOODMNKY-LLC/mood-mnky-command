-- =============================================================================
-- Tenants: Coolify project UUID (namespace per tenant)
-- Purpose: One Coolify project per tenant so all that tenant's apps live in one
--   Coolify project. App Factory creates/uses this project when deploying.
-- =============================================================================

alter table public.tenants
  add column if not exists coolify_project_uuid text;

comment on column public.tenants.coolify_project_uuid is
  'Coolify project UUID used as namespace for this tenant''s App Factory apps. Created on first deploy if not set.';

create index if not exists idx_tenants_coolify_project_uuid
  on public.tenants(coolify_project_uuid)
  where coolify_project_uuid is not null;

-- Drop if exists so migration is idempotent (e.g. re-run after partial apply).
drop policy if exists "tenants_update_admin" on public.tenants;
drop policy if exists "tenants_update_platform_admin" on public.tenants;

-- Tenant owners/admins can update their tenant (e.g. to persist coolify_project_uuid
-- when App Factory creates a Coolify project for the tenant).
create policy "tenants_update_admin"
  on public.tenants for update
  to authenticated
  using (
    id in (
      select tm.tenant_id
      from public.tenant_members tm
      where tm.user_id = auth.uid()
        and tm.role in ('owner', 'admin')
    )
  )
  with check (
    id in (
      select tm.tenant_id
      from public.tenant_members tm
      where tm.user_id = auth.uid()
        and tm.role in ('owner', 'admin')
    )
  );

-- Platform admins can update any tenant (e.g. set coolify_project_uuid from backoffice).
create policy "tenants_update_platform_admin"
  on public.tenants for update
  to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));
