-- =============================================================================
-- App Factory: audit log for project creation and deletion
-- Purpose: Record who created/deleted projects and when; metadata for audit trail.
-- =============================================================================

create table if not exists public.app_factory_audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null check (action in ('project_created', 'project_deleted')),
  project_id uuid references public.projects(id) on delete set null,
  actor_id uuid not null references auth.users(id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

comment on table public.app_factory_audit_log is 'Audit trail for App Factory project creation and deletion.';
comment on column public.app_factory_audit_log.action is 'project_created | project_deleted';
comment on column public.app_factory_audit_log.metadata is 'name, slug, template_key, tenant_id, github_repo_url, coolify_application_uuid, etc.';

create index idx_app_factory_audit_log_action on public.app_factory_audit_log(action);
create index idx_app_factory_audit_log_created_at on public.app_factory_audit_log(created_at desc);
create index idx_app_factory_audit_log_project_id on public.app_factory_audit_log(project_id) where project_id is not null;

alter table public.app_factory_audit_log enable row level security;

-- Only platform_admin can read audit log; inserts allowed by authenticated (server actions run as user).
create policy "app_factory_audit_log_select_platform_admin"
  on public.app_factory_audit_log for select
  to authenticated
  using (public.is_platform_admin(auth.uid()));

create policy "app_factory_audit_log_insert_authenticated"
  on public.app_factory_audit_log for insert
  to authenticated
  with check (auth.uid() = actor_id);
