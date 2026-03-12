-- =============================================================================
-- App Factory: deployment_specs
-- Purpose: Immutable snapshot of deployment config per release attempt.
--   RLS: same as projects (tenant member read, tenant admin insert, platform_admin all).
-- =============================================================================

create table if not exists public.deployment_specs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  spec_json jsonb not null,
  spec_version text not null default '1',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

comment on table public.deployment_specs is 'Immutable deployment spec snapshot per generation/deploy attempt.';
comment on column public.deployment_specs.spec_json is 'Canonical deployment config (identity, app metadata, branding, auth, deployment, features, secrets).';

create index idx_deployment_specs_project_id on public.deployment_specs(project_id);

alter table public.deployment_specs enable row level security;

create policy "deployment_specs_select_via_project"
  on public.deployment_specs for select
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
      and (public.is_tenant_member(p.tenant_id, auth.uid()) or public.is_platform_admin(auth.uid()))
    )
  );

create policy "deployment_specs_insert_via_project"
  on public.deployment_specs for insert
  to authenticated
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
      and (public.is_tenant_admin(p.tenant_id, auth.uid()) or public.is_platform_admin(auth.uid()))
    )
  );

-- No update/delete: specs are immutable; only insert allowed.
create policy "deployment_specs_update_platform_admin"
  on public.deployment_specs for update
  to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy "deployment_specs_delete_platform_admin"
  on public.deployment_specs for delete
  to authenticated
  using (public.is_platform_admin(auth.uid()));
