-- Multi-tenant Supabase (MT) — tenant_app_instances (per-tenant app/config e.g. Flowise, n8n).
-- Purpose: Store per-tenant base URLs, API keys, and settings for multi-tenant apps (Flowise, n8n,
-- or other Postgres-backed services). Apps resolve config by tenant_id + app_type; fall back to env if no row.
-- Run only against the MT Supabase project.

create table if not exists public.tenant_app_instances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  app_type text not null,
  base_url text,
  api_key_encrypted text,
  settings jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tenant_id, app_type)
);

comment on table public.tenant_app_instances is 'Per-tenant config for external apps (e.g. flowise, n8n). base_url and api_key_encrypted; optional settings (db_url, workspace_id, etc.).';
comment on column public.tenant_app_instances.app_type is 'App identifier: flowise, n8n, or other. Used by app layer to resolve which instance to call for a tenant.';
comment on column public.tenant_app_instances.api_key_encrypted is 'Encrypted API key if needed. Decrypt server-side only; use project encryption (e.g. credentials-encrypt) when writing.';
comment on column public.tenant_app_instances.settings is 'Extra config: e.g. database_url (for Postgres-backed Flowise/n8n), workspace_id, webhook_secret.';

create index idx_tenant_app_instances_tenant_id on public.tenant_app_instances(tenant_id);
create index idx_tenant_app_instances_tenant_app on public.tenant_app_instances(tenant_id, app_type);

alter table public.tenant_app_instances enable row level security;

create policy "tenant_app_instances_select_member"
  on public.tenant_app_instances for select
  to authenticated
  using (public.is_tenant_member(tenant_id, auth.uid()));

create policy "tenant_app_instances_insert_admin"
  on public.tenant_app_instances for insert
  to authenticated
  with check (public.is_tenant_admin(tenant_id, auth.uid()));

create policy "tenant_app_instances_update_admin"
  on public.tenant_app_instances for update
  to authenticated
  using (public.is_tenant_admin(tenant_id, auth.uid()))
  with check (public.is_tenant_admin(tenant_id, auth.uid()));

create policy "tenant_app_instances_delete_admin"
  on public.tenant_app_instances for delete
  to authenticated
  using (public.is_tenant_admin(tenant_id, auth.uid()));
