-- =============================================================================
-- App Factory: Platforms as first template + sort_order for template list.
-- Adds sort_order to template_registry, inserts Platforms template/version,
-- and ensures Platforms appears first in the Launch Wizard.
-- =============================================================================

-- Optional: add sort_order so we can control template order in the wizard
alter table public.template_registry
  add column if not exists sort_order integer not null default 999;

comment on column public.template_registry.sort_order is 'Lower value = earlier in template list (e.g. 0 = Platforms first).';

-- Insert Platforms template (reference: temp/platforms in repo). Safe to run multiple times.
insert into public.template_registry (template_key, display_name, current_version, status, sort_order)
values ('platforms', 'Platforms', '1.0.0', 'active', 0)
on conflict (template_key) do update set
  display_name = excluded.display_name,
  current_version = excluded.current_version,
  status = excluded.status,
  sort_order = 0,
  updated_at = now();

-- Insert version for Platforms (local template; git_ref null = use APP_FACTORY_TEMPLATE_PATH / temp/platforms)
insert into public.template_versions (template_id, version, manifest_json, git_ref, release_notes)
select t.id, '1.0.0',
  '{"required_config":["app_metadata.slug","app_metadata.name"],"supported_deployment_modes":["shared_multi_tenant","dedicated_app_shared_host","dedicated_runtime"],"env_placeholders":["NEXT_PUBLIC_ROOT_DOMAIN","KV_REST_API_URL","KV_REST_API_TOKEN"],"source":"local","description":"Next.js multi-tenant reference (temp/platforms)."}'::jsonb,
  null,
  'Reference template: Next.js multi-tenant app (temp/platforms). Use for test deploys.'
from public.template_registry t
where t.template_key = 'platforms'
on conflict (template_id, version) do update set
  manifest_json = excluded.manifest_json,
  git_ref = excluded.git_ref,
  release_notes = excluded.release_notes;

-- Ensure existing nextjs-mt-starter has a higher sort_order so Platforms is first
update public.template_registry
set sort_order = 1, updated_at = now()
where template_key = 'nextjs-mt-starter';

-- Index for ordering
create index if not exists idx_template_registry_sort_order
  on public.template_registry(sort_order);
