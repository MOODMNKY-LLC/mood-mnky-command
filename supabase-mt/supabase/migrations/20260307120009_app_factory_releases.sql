-- =============================================================================
-- App Factory: releases
-- Purpose: Deployed artifact/version tied to a project and environment.
--   Links to deployment_spec used and git commit. RLS: same as projects.
-- =============================================================================

create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  environment_name text not null,
  deployment_spec_id uuid references public.deployment_specs(id) on delete set null,
  git_commit_sha text,
  status text not null check (
    status in ('deploying', 'live', 'failed', 'rolled_back')
  ),
  deployed_at timestamptz,
  created_at timestamptz default now()
);

comment on table public.releases is 'Deployed artifact per project/environment; ties to spec and git commit.';
comment on column public.releases.deployment_spec_id is 'Snapshot of deployment spec used for this release.';

create index idx_releases_project_id on public.releases(project_id);
create index idx_releases_deployed_at on public.releases(deployed_at);

alter table public.releases enable row level security;

create policy "releases_select_via_project"
  on public.releases for select
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
      and (public.is_tenant_member(p.tenant_id, auth.uid()) or public.is_platform_admin(auth.uid()))
    )
  );

create policy "releases_insert_via_project"
  on public.releases for insert
  to authenticated
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
      and (public.is_tenant_admin(p.tenant_id, auth.uid()) or public.is_platform_admin(auth.uid()))
    )
  );

create policy "releases_update_via_project"
  on public.releases for update
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

create policy "releases_delete_platform_admin"
  on public.releases for delete
  to authenticated
  using (public.is_platform_admin(auth.uid()));
