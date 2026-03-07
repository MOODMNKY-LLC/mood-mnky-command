-- =============================================================================
-- App Factory: seed default template and version so Launch Wizard has a choice.
-- Safe to run multiple times (ON CONFLICT DO NOTHING).
-- =============================================================================

insert into public.template_registry (template_key, display_name, current_version, status)
values ('nextjs-mt-starter', 'Next.js MT Starter', '0.1.0', 'active')
on conflict (template_key) do update set
  display_name = excluded.display_name,
  current_version = excluded.current_version,
  updated_at = now();

insert into public.template_versions (template_id, version, manifest_json, release_notes)
select t.id, '0.1.0',
  '{"required_config":["app_metadata.slug","app_metadata.name"],"supported_deployment_modes":["shared_multi_tenant","dedicated_app_shared_host","dedicated_runtime"],"env_placeholders":["NEXT_PUBLIC_APP_URL","NEXT_PUBLIC_SUPABASE_MT_URL","NEXT_PUBLIC_SUPABASE_MT_ANON_KEY"]}'::jsonb,
  'Default scaffold for App Factory (README, package.json, .env.example).'
from public.template_registry t
where t.template_key = 'nextjs-mt-starter'
on conflict (template_id, version) do update set
  manifest_json = excluded.manifest_json,
  release_notes = excluded.release_notes;
