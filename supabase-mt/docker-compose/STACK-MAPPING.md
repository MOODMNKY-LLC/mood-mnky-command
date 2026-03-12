# Stack mapping (app / DB / services)

Short reference for how Portal, Supabase MT, and this Docker Compose stack fit together. Flowise and n8n connect only to the stack's Postgres; they do not use Supabase. For full multitenant architecture and S3/orchestration patterns, see [CHATGPT-MULTITENANT-APP-STACK.md](../CHATGPT-MULTITENANT-APP-STACK.md).

## Component roles

| Component | Role | Storage / DB |
|-----------|------|--------------|
| **Portal** | Next.js app; auth and tenant routing via Supabase; reads `tenant_app_instances.base_url` for Flowise/n8n | — |
| **Supabase MT** | Auth, RLS, tenant metadata, `tenant_app_instances` (Flowise/n8n base URLs) | Its own Postgres (local `supabase start` or Cloud) |
| **Flowise** | AI workflows; optional S3 (MinIO) for artifacts | Compose Postgres + optional MinIO bucket `flowise-artifacts` |
| **n8n** | Workflow automation; Redis queue; optional S3 (MinIO) for binary data | Compose Postgres + Redis + optional MinIO bucket `n8n-binaries` |
| **MinIO** | S3-compatible blob storage for this stack | `minio_data` volume |
| **Postgres (compose)** | Flowise DB + n8n DB | `postgres_data` volume |
| **Redis** | Flowise cache; n8n queue | `redis_data` volume |

## Storage and buckets

- **Supabase:** Holds metadata (e.g. `storage_objects`). App uploads can use Supabase Storage (local or Cloud).
- **This stack:** Optional MinIO buckets `flowise-artifacts` and `n8n-binaries` for Flowise S3 storage and n8n binary data. Enable via `FLOWISE_STORAGE_TYPE=s3` and/or `BINARYDATA_STORAGE_TYPE=s3`.
- **Multitenancy:** Per CHATGPT-MULTITENANT-APP-STACK, use one bucket with prefixes (e.g. `orgs/{org_id}/`, `flowise/`, `n8n/`) or separate buckets per concern. This compose uses two buckets for clarity.

## What this compose does not run

This file does **not** run the full Supabase stack (studio, kong, auth, rest, realtime, storage, imgproxy, meta, functions, analytics, db, vector, supavisor). For full self-hosted Supabase, run the reference stack from `temp/supabase/docker` (or clone `supabase/supabase` and use its `docker/`). This compose stays as Flowise + n8n + Postgres + Redis + MinIO.
