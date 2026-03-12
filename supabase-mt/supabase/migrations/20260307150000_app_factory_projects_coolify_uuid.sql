-- =============================================================================
-- App Factory: add coolify_application_uuid to projects
-- Purpose: Store Coolify application UUID after deploy so we can view status,
--   open deployment URL, and delete the app from the portal.
-- =============================================================================

alter table public.projects
  add column if not exists coolify_application_uuid text;

comment on column public.projects.coolify_application_uuid is 'Coolify application UUID after deploy; used for view status and delete.';

create index if not exists idx_projects_coolify_application_uuid
  on public.projects(coolify_application_uuid)
  where coolify_application_uuid is not null;
