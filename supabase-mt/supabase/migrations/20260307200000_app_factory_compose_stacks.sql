-- =============================================================================
-- App Factory: compose_stacks — Docker Compose content stored in Supabase
-- Purpose: Store deployment-ready compose YAML; app retrieves and sends to
--   Coolify via POST /applications/dockercompose (docker_compose_raw).
--   Templates are version-controlled in the repo; app periodically syncs
--   updated content into this table.
-- =============================================================================

create table if not exists public.compose_stacks (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  name text not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.compose_stacks is 'Docker Compose YAML stored for in-app deploy via Coolify raw API. Synced from repo (template source_path).';
comment on column public.compose_stacks.template_key is 'Links to template_registry.template_key (e.g. agent-stack).';
comment on column public.compose_stacks.content is 'Full docker-compose YAML string.';

create index idx_compose_stacks_template_key on public.compose_stacks(template_key);

alter table public.compose_stacks enable row level security;

create policy "compose_stacks_select_authenticated"
  on public.compose_stacks for select
  to authenticated
  using (true);

create policy "compose_stacks_insert_platform_admin"
  on public.compose_stacks for insert
  to authenticated
  with check (public.is_platform_admin(auth.uid()));

create policy "compose_stacks_update_platform_admin"
  on public.compose_stacks for update
  to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy "compose_stacks_delete_platform_admin"
  on public.compose_stacks for delete
  to authenticated
  using (public.is_platform_admin(auth.uid()));
