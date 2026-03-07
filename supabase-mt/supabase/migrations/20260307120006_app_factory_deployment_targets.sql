-- =============================================================================
-- App Factory: deployment_targets
-- Purpose: Available deployment nodes (Proxmox node, Coolify instance, host).
--   Used when selecting where to deploy. RLS: platform_admin manage; authenticated read.
-- =============================================================================

create table if not exists public.deployment_targets (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('proxmox_node', 'coolify_server', 'host')),
  proxmox_node text,
  coolify_instance text,
  host_identifier text,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.deployment_targets is 'Available deployment targets (Proxmox node, Coolify server, host) for app factory.';
comment on column public.deployment_targets.coolify_instance is 'Coolify server UUID or identifier.';

create index idx_deployment_targets_active on public.deployment_targets(active);

alter table public.deployment_targets enable row level security;

create policy "deployment_targets_select_authenticated"
  on public.deployment_targets for select
  to authenticated
  using (true);

create policy "deployment_targets_insert_platform_admin"
  on public.deployment_targets for insert
  to authenticated
  with check (public.is_platform_admin(auth.uid()));

create policy "deployment_targets_update_platform_admin"
  on public.deployment_targets for update
  to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy "deployment_targets_delete_platform_admin"
  on public.deployment_targets for delete
  to authenticated
  using (public.is_platform_admin(auth.uid()));
