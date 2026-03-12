-- =============================================================================
-- App Factory: Full Stack template (Supabase self-hosted + Flowise + n8n)
-- Purpose: Register full-stack so Launch Wizard can offer it; sync reads
--   docker-compose.full-stack.yml from temp/full-stack. Deploy requires
--   Supabase ./volumes/ on the Coolify server; see FULL-STACK-RUNBOOK.
-- =============================================================================

insert into public.template_registry (template_key, display_name, current_version, status, sort_order, source_path)
values ('full-stack', 'Full stack (Supabase + Flowise + n8n)', '1.0.0', 'active', 2, 'temp/full-stack')
on conflict (template_key) do update set
  display_name = excluded.display_name,
  current_version = excluded.current_version,
  status = excluded.status,
  sort_order = excluded.sort_order,
  source_path = excluded.source_path,
  updated_at = now();

insert into public.template_versions (template_id, version, manifest_json, git_ref, release_notes)
select t.id, '1.0.0',
  '{"required_config":["app_metadata.slug","app_metadata.name"],"supported_deployment_modes":["dedicated_runtime"],"env_placeholders":["POSTGRES_PASSWORD","JWT_SECRET","ANON_KEY","SERVICE_ROLE_KEY","FLOWISE_PASSWORD","N8N_BASIC_AUTH_PASSWORD","MINIO_ROOT_PASSWORD"],"source":"local","description":"Docker Compose: Supabase self-hosted + Flowise (queue+worker) + n8n + MinIO. Requires Supabase ./volumes/ on deploy server; see FULL-STACK-RUNBOOK."}'::jsonb,
  null,
  'Full stack: Supabase self-hosted + Flowise + n8n for Coolify. Requires volumes.'
from public.template_registry t
where t.template_key = 'full-stack'
on conflict (template_id, version) do update set
  manifest_json = excluded.manifest_json,
  git_ref = excluded.git_ref,
  release_notes = excluded.release_notes;
