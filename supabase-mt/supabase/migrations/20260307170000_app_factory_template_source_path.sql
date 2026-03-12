-- =============================================================================
-- App Factory: template_registry.source_path for DB-driven template resolution
-- Purpose: Resolve template content from repo path (e.g. temp/platforms, temp/agent-stack).
-- =============================================================================

alter table public.template_registry
  add column if not exists source_path text;

comment on column public.template_registry.source_path is 'Relative path from repo root where template files live (e.g. temp/platforms, temp/agent-stack).';

-- Backfill Platforms
update public.template_registry
set source_path = 'temp/platforms'
where template_key = 'platforms'
  and source_path is null;
