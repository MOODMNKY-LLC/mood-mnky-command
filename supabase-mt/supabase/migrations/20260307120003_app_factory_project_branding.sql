-- =============================================================================
-- App Factory: project_branding
-- Purpose: Per-project branding (display name, logo, colors, support email).
--   RLS: same as projects (tenant member read, tenant admin write, platform_admin all).
-- =============================================================================

create table if not exists public.project_branding (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  display_name text,
  logo_asset_url text,
  icon_asset_url text,
  primary_color text,
  secondary_color text,
  accent_color text,
  support_email text,
  legal_footer text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (project_id)
);

comment on table public.project_branding is 'Per-project branding for generated apps.';

create index idx_project_branding_project_id on public.project_branding(project_id);

alter table public.project_branding enable row level security;

create policy "project_branding_select_via_project"
  on public.project_branding for select
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
      and (public.is_tenant_member(p.tenant_id, auth.uid()) or public.is_platform_admin(auth.uid()))
    )
  );

create policy "project_branding_insert_via_project"
  on public.project_branding for insert
  to authenticated
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
      and (public.is_tenant_admin(p.tenant_id, auth.uid()) or public.is_platform_admin(auth.uid()))
    )
  );

create policy "project_branding_update_via_project"
  on public.project_branding for update
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

create policy "project_branding_delete_via_project"
  on public.project_branding for delete
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
      and (public.is_tenant_admin(p.tenant_id, auth.uid()) or public.is_platform_admin(auth.uid()))
    )
  );
