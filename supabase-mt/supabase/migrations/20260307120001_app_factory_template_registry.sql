-- =============================================================================
-- App Factory: template_registry and template_versions
-- Purpose: Approved app templates and locked versions for generation.
--   RLS: platform_admin for manage; authenticated read for launch wizard.
-- =============================================================================

create table if not exists public.template_registry (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  display_name text not null,
  current_version text,
  status text not null default 'active' check (status in ('active', 'deprecated', 'hidden')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.template_registry is 'Approved base app archetypes for the app factory.';
comment on column public.template_registry.template_key is 'Unique identifier (e.g. nextjs-mt-starter).';
comment on column public.template_registry.status is 'active, deprecated, or hidden from new launches.';

create index idx_template_registry_status on public.template_registry(status);

alter table public.template_registry enable row level security;

create policy "template_registry_select_authenticated"
  on public.template_registry for select
  to authenticated
  using (true);

create policy "template_registry_insert_platform_admin"
  on public.template_registry for insert
  to authenticated
  with check (public.is_platform_admin(auth.uid()));

create policy "template_registry_update_platform_admin"
  on public.template_registry for update
  to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy "template_registry_delete_platform_admin"
  on public.template_registry for delete
  to authenticated
  using (public.is_platform_admin(auth.uid()));

-- =============================================================================
-- template_versions: locked release of a template
-- =============================================================================

create table if not exists public.template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.template_registry(id) on delete cascade,
  version text not null,
  manifest_json jsonb not null default '{}',
  git_ref text,
  release_notes text,
  created_at timestamptz default now(),
  unique (template_id, version)
);

comment on table public.template_versions is 'Locked release of a template; referenced by projects for generation.';
comment on column public.template_versions.manifest_json is 'Template manifest: required config, feature flags, etc.';
comment on column public.template_versions.git_ref is 'Git ref (tag, branch, or commit) for this version.';

create index idx_template_versions_template_id on public.template_versions(template_id);

alter table public.template_versions enable row level security;

create policy "template_versions_select_authenticated"
  on public.template_versions for select
  to authenticated
  using (true);

create policy "template_versions_insert_platform_admin"
  on public.template_versions for insert
  to authenticated
  with check (public.is_platform_admin(auth.uid()));

create policy "template_versions_update_platform_admin"
  on public.template_versions for update
  to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy "template_versions_delete_platform_admin"
  on public.template_versions for delete
  to authenticated
  using (public.is_platform_admin(auth.uid()));
