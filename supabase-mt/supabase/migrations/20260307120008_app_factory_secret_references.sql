-- =============================================================================
-- App Factory: secret_references
-- Purpose: Metadata about required secrets per project/environment (no plaintext).
--   RLS: same as projects.
-- =============================================================================

create table if not exists public.secret_references (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  environment_name text not null,
  secret_name text not null,
  secret_scope text,
  injected_at timestamptz,
  rotation_policy text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.secret_references is 'Metadata for required secrets per project/env; values stored in Coolify or vault, not here.';
comment on column public.secret_references.rotation_policy is 'Optional rotation policy description.';

create index idx_secret_references_project_id on public.secret_references(project_id);

alter table public.secret_references enable row level security;

create policy "secret_references_select_via_project"
  on public.secret_references for select
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
      and (public.is_tenant_member(p.tenant_id, auth.uid()) or public.is_platform_admin(auth.uid()))
    )
  );

create policy "secret_references_insert_via_project"
  on public.secret_references for insert
  to authenticated
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
      and (public.is_tenant_admin(p.tenant_id, auth.uid()) or public.is_platform_admin(auth.uid()))
    )
  );

create policy "secret_references_update_via_project"
  on public.secret_references for update
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

create policy "secret_references_delete_via_project"
  on public.secret_references for delete
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
      and (public.is_tenant_admin(p.tenant_id, auth.uid()) or public.is_platform_admin(auth.uid()))
    )
  );
