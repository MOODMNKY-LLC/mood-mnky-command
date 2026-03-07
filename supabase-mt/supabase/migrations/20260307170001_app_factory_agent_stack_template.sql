-- =============================================================================
-- App Factory: Agent Stack template (Docker Compose)
-- Purpose: Register Agent Stack so Launch Wizard can deploy it from temp/agent-stack.
-- =============================================================================

insert into public.template_registry (template_key, display_name, current_version, status, sort_order, source_path)
values ('agent-stack', 'Agent Stack', '1.0.0', 'active', 1, 'temp/agent-stack')
on conflict (template_key) do update set
  display_name = excluded.display_name,
  current_version = excluded.current_version,
  status = excluded.status,
  sort_order = excluded.sort_order,
  source_path = excluded.source_path,
  updated_at = now();

insert into public.template_versions (template_id, version, manifest_json, git_ref, release_notes)
select t.id, '1.0.0',
  '{"required_config":["app_metadata.slug","app_metadata.name"],"supported_deployment_modes":["dedicated_app_shared_host","dedicated_runtime"],"env_placeholders":["POSTGRES_PASSWORD","MINIO_ROOT_PASSWORD","FLOWISE_PASSWORD","N8N_BASIC_AUTH_PASSWORD"],"source":"local","description":"Docker Compose stack: PostgreSQL, Redis, MinIO, Flowise, n8n, optional Ollama and Qdrant. Deploy via Coolify Docker Compose build pack."}'::jsonb,
  null,
  'Agent Stack: full compose stack for Coolify (temp/agent-stack).'
from public.template_registry t
where t.template_key = 'agent-stack'
on conflict (template_id, version) do update set
  manifest_json = excluded.manifest_json,
  git_ref = excluded.git_ref,
  release_notes = excluded.release_notes;
