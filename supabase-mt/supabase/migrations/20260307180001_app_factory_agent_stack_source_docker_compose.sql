-- =============================================================================
-- App Factory: Agent Stack source_path → docker-compose directory
-- Purpose: Use the real docker-compose directory instead of temp/agent-stack.
--          All template source paths are stored in Supabase (template_registry.source_path).
-- =============================================================================

update public.template_registry
set source_path = 'docker-compose',
    updated_at = now()
where template_key = 'agent-stack';

update public.template_versions
set release_notes = 'Agent Stack: full compose stack from docker-compose directory. Deploy via Coolify Docker Compose build pack.'
from public.template_registry t
where template_versions.template_id = t.id
  and t.template_key = 'agent-stack';
