-- =============================================================================
-- App Factory: Next.js + Supabase starter template (Vercel example)
-- Purpose: Register with-supabase so Launch Wizard can offer it; source
--   lives at temp/with-supabase-example (cloned from next.js/examples/with-supabase).
-- =============================================================================

insert into public.template_registry (template_key, display_name, current_version, status, sort_order, source_path)
values ('with-supabase', 'Next.js + Supabase Starter', '1.0.0', 'active', 3, 'temp/with-supabase-example')
on conflict (template_key) do update set
  display_name = excluded.display_name,
  current_version = excluded.current_version,
  status = excluded.status,
  sort_order = excluded.sort_order,
  source_path = excluded.source_path,
  updated_at = now();

insert into public.template_versions (template_id, version, manifest_json, git_ref, release_notes)
select t.id, '1.0.0',
  '{"required_config":["app_metadata.slug","app_metadata.name"],"supported_deployment_modes":["shared_multi_tenant","dedicated_app_shared_host","dedicated_runtime"],"env_placeholders":["NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],"source":"local","description":"Next.js + Supabase starter (cookie-based auth, App Router, shadcn/ui). From Vercel next.js/examples/with-supabase."}'::jsonb,
  null,
  'Next.js + Supabase starter: cookie-based auth, App Router, Tailwind, shadcn/ui. Deploy via App Factory or Vercel.'
from public.template_registry t
where t.template_key = 'with-supabase'
on conflict (template_id, version) do update set
  manifest_json = excluded.manifest_json,
  git_ref = excluded.git_ref,
  release_notes = excluded.release_notes;
