-- =============================================================================
-- App Factory: releases.git_tag for version display
-- =============================================================================

alter table public.releases
  add column if not exists git_tag text;

comment on column public.releases.git_tag is 'Git tag created for this release (e.g. deploy-2025-03-07T12-00-00).';
