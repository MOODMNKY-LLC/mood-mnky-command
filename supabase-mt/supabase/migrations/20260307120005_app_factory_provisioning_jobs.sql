-- =============================================================================
-- App Factory: provisioning_jobs
-- Purpose: Tracked job for spec generation, code generation, repo push,
--   infra, coolify deploy, health check. Status and logs per job.
--   RLS: same as projects.
-- =============================================================================

create table if not exists public.provisioning_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  job_type text not null check (
    job_type in (
      'spec_generation', 'code_generation', 'repo_push',
      'infra_provisioning', 'ansible_bootstrap', 'coolify_deploy',
      'health_verification', 'rollback'
    )
  ),
  status text not null default 'pending' check (
    status in ('pending', 'running', 'success', 'failed', 'cancelled')
  ),
  started_at timestamptz,
  finished_at timestamptz,
  log_ref text,
  retry_of uuid references public.provisioning_jobs(id) on delete set null,
  created_at timestamptz default now()
);

comment on table public.provisioning_jobs is 'Tracked job for each major app factory step; immutable audit trail.';
comment on column public.provisioning_jobs.log_ref is 'Reference to log storage (e.g. object path or external id).';
comment on column public.provisioning_jobs.retry_of is 'If this job is a retry, reference the failed job id.';

create index idx_provisioning_jobs_project_id on public.provisioning_jobs(project_id);
create index idx_provisioning_jobs_status on public.provisioning_jobs(status);
create index idx_provisioning_jobs_started_at on public.provisioning_jobs(started_at);

alter table public.provisioning_jobs enable row level security;

create policy "provisioning_jobs_select_via_project"
  on public.provisioning_jobs for select
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
      and (public.is_tenant_member(p.tenant_id, auth.uid()) or public.is_platform_admin(auth.uid()))
    )
  );

create policy "provisioning_jobs_insert_via_project"
  on public.provisioning_jobs for insert
  to authenticated
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
      and (public.is_tenant_admin(p.tenant_id, auth.uid()) or public.is_platform_admin(auth.uid()))
    )
  );

create policy "provisioning_jobs_update_via_project"
  on public.provisioning_jobs for update
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

create policy "provisioning_jobs_delete_platform_admin"
  on public.provisioning_jobs for delete
  to authenticated
  using (public.is_platform_admin(auth.uid()));
