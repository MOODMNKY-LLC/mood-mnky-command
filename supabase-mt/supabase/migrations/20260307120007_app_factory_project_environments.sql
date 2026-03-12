-- =============================================================================
-- App Factory: project_environments
-- Purpose: Per-environment (e.g. production, staging) domain, Coolify app UUID,
--   infra target, release status. RLS: same as projects.
-- =============================================================================

create table if not exists public.project_environments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  environment_name text not null,
  domain text,
  coolify_app_uuid text,
  infra_target_id uuid references public.deployment_targets(id) on delete set null,
  release_status text check (
    release_status in ('pending', 'deploying', 'live', 'failed', 'rolled_back')
  ),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (project_id, environment_name)
);

comment on table public.project_environments is 'Per-environment deployment info: domain, Coolify app, release status.';
comment on column public.project_environments.coolify_app_uuid is 'Coolify application UUID after create.';

create index idx_project_environments_project_id on public.project_environments(project_id);

alter table public.project_environments enable row level security;

create policy "project_environments_select_via_project"
  on public.project_environments for select
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
      and (public.is_tenant_member(p.tenant_id, auth.uid()) or public.is_platform_admin(auth.uid()))
    )
  );

create policy "project_environments_insert_via_project"
  on public.project_environments for insert
  to authenticated
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
      and (public.is_tenant_admin(p.tenant_id, auth.uid()) or public.is_platform_admin(auth.uid()))
    )
  );

create policy "project_environments_update_via_project"
  on public.project_environments for update
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
      and (public.is_tenant_admin(p.tenant_id, auth.uid()) or public.is_platform_admin(auth.uid()))
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
      and (public.is_tenant_admin(p.tenant_id, auth.uid()) or public.is_platform_admin(auth.uid()))
    )
  );

create policy "project_environments_delete_via_project"
  on public.project_environments for delete
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
      and (public.is_tenant_admin(p.tenant_id, auth.uid()) or public.is_platform_admin(auth.uid()))
    )
  );
