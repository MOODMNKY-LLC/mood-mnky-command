-- Jellyfin theme build registry (optional versioned supply chain).
-- Used by theme-publish Edge Function and GitHub Action when building per jellyfin-web release.
-- Manual theme publishes use infra_artifact_versions; this table tracks versioned CI builds.

create table if not exists public.jellyfin_theme_builds (
  version text primary key,
  built_at timestamptz not null default now(),
  css_object_path text not null,
  sha256 text not null,
  source_repo text not null default 'jellyfin/jellyfin-web',
  notes text
);

comment on table public.jellyfin_theme_builds is 'Published Jellyfin theme builds from CI (jellyfin-web version → CSS path in Storage).';

create table if not exists public.jellyfin_theme_latest (
  id int primary key default 1,
  version text not null references public.jellyfin_theme_builds(version),
  updated_at timestamptz not null default now()
);

comment on table public.jellyfin_theme_latest is 'Pointer to current Jellyfin theme version (for dashboards / latest.css).';

-- Placeholder so jellyfin_theme_latest can reference version 10.11.6 (replace via theme-publish when CI runs).
insert into public.jellyfin_theme_builds (version, css_object_path, sha256, notes)
values ('10.11.6', 'themes/latest/mnky-media/mnky.css', '0000000000000000000000000000000000000000000000000000000000000000', 'Placeholder; overwrite via theme-publish or manual publish:infra.')
on conflict (version) do nothing;

insert into public.jellyfin_theme_latest (id, version)
values (1, '10.11.6')
on conflict (id) do nothing;

create index if not exists idx_jellyfin_theme_builds_built_at
  on public.jellyfin_theme_builds (built_at desc);

alter table public.jellyfin_theme_builds enable row level security;
alter table public.jellyfin_theme_latest enable row level security;

-- Read: service role only (Edge Function, admin). No anon/authenticated policies.
-- Writes: service role only (theme-publish Edge Function).
