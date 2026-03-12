# Infra artifacts

Theme CSS, Docker/Compose files, and n8n workflows for MOOD MNKY services. These are published to Supabase Storage via `scripts/publish-infra-artifacts` and registered in `infra_artifact_versions`.

- **service-themes/** – Per-service CSS (Nextcloud, Jellyfin, Jellyseerr, Flowise) derived from [docs/DESIGN-SYSTEM.md](../docs/DESIGN-SYSTEM.md).
- **docker/** – Dockerfiles and overlay fragments per service.
- **n8n/workflows/** – Exported n8n workflow JSON files.

See [docs/INFRA-STORAGE.md](../docs/INFRA-STORAGE.md) for bucket layout and publish script usage.
