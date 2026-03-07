-- Multi-instance support: add name to tenant_app_instances, allow multiple instances per (tenant, app_type).
-- Platform admin RLS: allow platform_admin to select/insert/update/delete any row.
-- Run only against the MT Supabase project.

-- Add name column (nullable first for backfill)
alter table public.tenant_app_instances
  add column if not exists name text;

-- Backfill: set name to 'default' where null so existing rows get a single default instance
update public.tenant_app_instances
set name = 'default'
where name is null;

-- Default for new rows
alter table public.tenant_app_instances
  alter column name set default 'default';

comment on column public.tenant_app_instances.name is 'Instance label per tenant+app_type (e.g. default, staging, prod). Enables multiple Flowise/n8n instances per org.';

-- Drop old unique constraint and add new one including name
alter table public.tenant_app_instances
  drop constraint if exists tenant_app_instances_tenant_id_app_type_key;

create unique index if not exists idx_tenant_app_instances_tenant_app_name
  on public.tenant_app_instances (tenant_id, app_type, coalesce(name, 'default'));

-- RLS: platform_admin can do everything on any row (for back office)
create policy "tenant_app_instances_platform_admin_all"
  on public.tenant_app_instances
  for all
  to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- Allow platform_admin to list all tenants (for back office instance management)
create policy "tenants_select_platform_admin"
  on public.tenants for select
  to authenticated
  using (public.is_platform_admin(auth.uid()));
