# App Factory: Deployment Spec and Template Manifest

Documentation for the deployment spec JSON schema and template manifest format used by the App Factory generator and Launch Wizard.

---

## Deployment Spec (JSON Schema)

The deployment spec is the canonical representation of what should be built and where it should go. It is validated with Zod before generation and stored as an immutable snapshot in the `deployment_specs` table.

### Schema version

- **spec_version**: `"1"` (literal).

### Top-level categories

| Category | Description |
|----------|-------------|
| **identity** | `customer_id` (optional), `project_id`, `tenant_id`. |
| **app_metadata** | `name`, `slug`, `domain` (optional). Slug must be `[a-z0-9-]+`. |
| **branding** | `display_name`, `logo_asset_url`, `icon_asset_url`, `primary_color`, `secondary_color`, `accent_color`, `support_email`, `legal_footer`. All optional. |
| **auth** | `providers` (array of strings), `redirect_urls` (array of URLs), `tenant_policy` (`"shared"` \| `"dedicated"`). Optional. |
| **data** | `supabase_strategy` (`"shared_rls"` \| `"shared_schema"` \| `"dedicated_project"`), `org_model`, `seed_behavior` (`"none"` \| `"minimal"` \| `"full"`). |
| **deployment** | `runtime_tier` (`"shared_multi_tenant"` \| `"dedicated_app_shared_host"` \| `"dedicated_runtime"`), `coolify_project_uuid`, `coolify_environment_uuid`, `coolify_server_uuid`, `coolify_host_port` (optional, 1024–65535, for IP:port when not using domains), `proxmox_target_id`. Optional UUIDs. |
| **features** | `modules`: record of module name → boolean (enabled/disabled). Optional. |
| **secrets** | `references`: array of `{ secret_name, secret_scope?, environment_name }`. No values stored. Optional. |
| **compliance_notes** | Free text. Optional. |
| **template_config** | Template-specific key/value config from manifest `form_fields`. Optional. Stored in spec for generator use. |

### TypeScript and validation

- **Types and Zod schema**: `portal/lib/app-factory/deployment-spec.ts`.
- **Validation**: Use `parseDeploymentSpec(data)` (throws) or `safeParseDeploymentSpec(data)` (returns result object).
- **Storage**: `deployment_specs.spec_json` stores the validated JSON; `deployment_specs.spec_version` stores `"1"`.

### Example (minimal)

```json
{
  "spec_version": "1",
  "identity": {
    "project_id": "uuid",
    "tenant_id": "uuid"
  },
  "app_metadata": {
    "name": "My App",
    "slug": "my-app",
    "domain": "my-app.example.com"
  },
  "data": {
    "supabase_strategy": "shared_rls"
  },
  "deployment": {
    "runtime_tier": "dedicated_app_shared_host"
  }
}
```

---

## Template Manifest Format

Each **template version** has a `manifest_json` that describes the template’s requirements and capabilities. The generator uses this to validate the deployment spec and to decide which files/routes to include.

### Recommended manifest shape

| Field | Type | Description |
|-------|------|-------------|
| **required_config** | `string[]` | List of deployment spec keys or paths that must be present (e.g. `["app_metadata.slug", "app_metadata.domain"]`). |
| **supported_deployment_modes** | `string[]` | `["shared_multi_tenant", "dedicated_app_shared_host", "dedicated_runtime"]` — subset that this template supports. |
| **auth_providers** | `string[]` | Supported auth providers (e.g. `["email", "google", "github"]`). |
| **feature_flags** | `Record<string, boolean>` | Default on/off for optional features (e.g. `{ "blending_lab": true, "dojo": false }`). |
| **env_placeholders** | `string[]` | Env var names that the generator will create as placeholders (e.g. `["NEXT_PUBLIC_APP_URL", "SUPABASE_URL"]`). No values; inject at deploy time. |
| **form_fields** | `array` | Optional. List of `{ key, label?, type?, required?, default? }` to render template-specific inputs in the Launch Wizard; values stored in spec as `template_config`. |
| **git_ref** | `string` | Overridden by `template_versions.git_ref`; optional in manifest for documentation. |

### Example manifest

```json
{
  "required_config": ["app_metadata.slug", "app_metadata.domain", "data.supabase_strategy"],
  "supported_deployment_modes": ["shared_multi_tenant", "dedicated_app_shared_host"],
  "auth_providers": ["email", "google"],
  "feature_flags": {
    "blending_lab": true,
    "dojo": false
  },
  "env_placeholders": [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SUPABASE_MT_URL",
    "NEXT_PUBLIC_SUPABASE_MT_ANON_KEY"
  ]
}
```

### Manifest-driven form fields (Launch Wizard)

Optional **form_fields** in `manifest_json` drive extra inputs in the Launch Wizard (App & branding step). Values are stored in the deployment spec as `template_config`.

| Field | Type | Description |
|-------|------|-------------|
| **key** | `string` | Config key (e.g. `POSTGRES_PASSWORD`). |
| **label** | `string` | Display label. Defaults to key. |
| **type** | `string` | Input type: `text`, `password`, etc. |
| **required** | `boolean` | If true, wizard shows “(required)”. |
| **default** | `string` | Placeholder or default value. |

Example:

```json
"form_fields": [
  { "key": "POSTGRES_PASSWORD", "label": "PostgreSQL password", "type": "password", "required": true },
  { "key": "FLOWISE_PORT", "label": "Flowise port", "default": "3000" }
]
```

### Generator use

- Before generation, the generator (or Server Action) should validate that the deployment spec satisfies `required_config` and that `deployment.runtime_tier` is in `supported_deployment_modes`.
- The generator copies the template, injects spec and branding, and writes env files with keys from `env_placeholders` and empty or placeholder values (no secrets).
- Template content is resolved from `template_registry.source_path` (e.g. `infra/templates/nextjs/platforms`, `docker-compose`).

### Default domain and build-time env

- The pipeline sets `NEXT_PUBLIC_ROOT_DOMAIN` and `NEXT_PUBLIC_APP_URL` on the Coolify application after create. For Next.js, ensure Coolify provides these at **build time** (e.g. as application env vars) so the built app uses the correct domain. The Platforms template fallback in production is `moodmnky.com` when `NEXT_PUBLIC_ROOT_DOMAIN` is unset.

### Future: Custom domains

- `app_metadata.domain` can hold a custom domain (e.g. tenant’s own domain). The pipeline passes it to Coolify when set. A future enhancement: tenant-level domain stored in DB, optional “Custom domain” field in the wizard, and CNAME/verification steps for Coolify.

---

## References

- [CHATGPT-MOOD-MNKY-PORTAL-V2.md](../../CHATGPT-MOOD-MNKY-PORTAL-V2.md) — PRD section 11.3 (Deployment Spec), 11.4 (App Generation Engine).
- [portal/lib/app-factory/deployment-spec.ts](../lib/app-factory/deployment-spec.ts) — Zod schema and types.
- [AGENT-TODO.md](../../AGENT-TODO.md) — T7 (this doc).
