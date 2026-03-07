-- =============================================================================
-- App Factory: store GitHub repo URL on projects for complete removal on delete
-- =============================================================================

alter table public.projects
  add column if not exists github_repo_url text;

comment on column public.projects.github_repo_url is 'GitHub repo URL (e.g. https://github.com/owner/repo) after push; used to delete repo when project is deleted.';
