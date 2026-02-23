# Infra artifacts storage (Supabase)

Theme CSS, Dockerfiles, and n8n workflows for MOOD MNKY services are stored in Supabase Storage and registered in the `infra_artifact_versions` table. This gives a single source of truth and public URLs (CDN-style) for deployment and LABZ.

## Buckets

| Bucket             | Purpose                                      | Public read |
|--------------------|----------------------------------------------|-------------|
| `infra-artifacts`  | Service themes (CSS), Docker files, n8n JSON | Yes         |

Path layout inside `infra-artifacts`:

- `themes/{versionTag}/{serviceId}/mnky.css` – e.g. `themes/v1/mnky-cloud/mnky.css`
- `docker/{versionTag}/{serviceId}/Dockerfile` – e.g. `docker/v1/mnky-cloud/Dockerfile`
- `n8n/workflows/{versionTag}/{name}.json` – exported n8n workflows

## Database

Table: `public.infra_artifact_versions`

- `artifact_type`: enum `service_theme`, `docker`, `compose`, `n8n_workflow`, `other`
- `service_id`: e.g. `mnky-cloud`, `mnky-media`, `mnky-auto` (nullable for global)
- `storage_path`: path within the bucket
- `version_tag`: e.g. `v1` or timestamp
- `created_at`: for “current” = latest by `(artifact_type, service_id)`

RLS: public read for `anon` and `authenticated`; no insert/update/delete for anon/authenticated (writes via service role only, e.g. publish script).

## Repo layout

Source files live under `infra/` at repo root:

- `infra/service-themes/{nextcloud,jellyfin,jellyseerr,flowise}/mnky.css`
- `infra/docker/{nextcloud,jellyfin,jellyseerr,n8n,flowise}/Dockerfile`
- `infra/n8n/workflows/*.json`

See [infra/README.md](../infra/README.md).

## Publish script

From repo root (loads `.env.local` and `.env`):

```bash
pnpm run publish:infra [versionTag]
```

Or from `apps/web`:

```bash
dotenv -e ../../.env.local -e ../../.env -- tsx scripts/publish-infra-artifacts.ts [versionTag]
```

`versionTag` defaults to a generated tag (e.g. `v1` or timestamp-based). The script:

1. Reads from `infra/service-themes`, `infra/docker`, `infra/n8n/workflows`
2. Uploads files to the `infra-artifacts` bucket under the versioned paths above
3. Inserts one row per file into `infra_artifact_versions`

**Required env:** `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY`. Same as other Supabase usage in the app.

## Resolving “current” artifact URL

In app or LABZ, to get the public URL for the latest theme for a service:

1. Query `infra_artifact_versions` where `artifact_type = 'service_theme'` and `service_id = 'mnky-cloud'`, order by `created_at desc`, limit 1.
2. Take `storage_path` and build the public URL with `supabase.storage.from('infra-artifacts').getPublicUrl(storage_path).data.publicUrl`.

Helper in app: use `BUCKETS.infraArtifacts` and `getPublicUrl()` from `@/lib/supabase/storage`.

## Bucket creation

Buckets are created by migration: `supabase/migrations/20260223120001_infra_artifacts_bucket.sql`. Run `supabase db push` or apply migrations in your Supabase project so the bucket and policies exist before running the publish script.

## See also

- [SERVICES-ENV.md](SERVICES-ENV.md) – per-service API credentials
- [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) – tokens used in service theme CSS
