-- Migration: infra_artifact_versions
-- Purpose: Registry of published theme/infra artifacts stored in Supabase Storage.
-- Affected: new table public.infra_artifact_versions.
-- RLS: public read (anon, authenticated) for discovery; writes via service role only (publish script).

-- ========== Artifact type enum ==========
-- Distinguishes theme CSS, docker files, n8n workflows, etc.
create type public.infra_artifact_type as enum (
  'service_theme',
  'docker',
  'compose',
  'n8n_workflow',
  'other'
);

comment on type public.infra_artifact_type is 'Kind of infra artifact (theme, docker, compose, n8n workflow).';

-- ========== Table: infra_artifact_versions ==========
-- One row per published artifact; version_tag (e.g. v1 or timestamp) allows multiple versions.
-- service_id matches MAIN_SERVICES (mnky-cloud, mnky-media, etc.); null for global artifacts.
create table if not exists public.infra_artifact_versions (
  id uuid primary key default gen_random_uuid(),
  artifact_type public.infra_artifact_type not null,
  service_id text,
  storage_path text not null,
  version_tag text not null,
  created_at timestamptz default now()
);

comment on table public.infra_artifact_versions is 'Published infra artifacts (themes, docker, n8n) in Storage; current version per (artifact_type, service_id) is latest by created_at.';
comment on column public.infra_artifact_versions.service_id is 'Service slug from main-services-data (e.g. mnky-cloud); null for global artifacts.';
comment on column public.infra_artifact_versions.storage_path is 'Path within the infra-artifacts bucket.';
comment on column public.infra_artifact_versions.version_tag is 'Version identifier (e.g. v1, or ISO timestamp).';

create index if not exists idx_infra_artifact_versions_lookup
  on public.infra_artifact_versions (artifact_type, service_id, created_at desc);

alter table public.infra_artifact_versions enable row level security;

-- Select: public read so LABZ and public service pages can resolve current artifact URLs.
create policy "infra_artifact_versions_select_anon"
  on public.infra_artifact_versions for select to anon using (true);

create policy "infra_artifact_versions_select_authenticated"
  on public.infra_artifact_versions for select to authenticated using (true);

-- Insert/update/delete: no policies for anon or authenticated; only service_role (publish script) can write.
