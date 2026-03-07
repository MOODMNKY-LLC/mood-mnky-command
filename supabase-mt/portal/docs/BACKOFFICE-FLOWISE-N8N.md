# Back Office: Flowise, n8n, MinIO & Nextcloud Integration

This doc describes the multitenant Flowise, n8n, MinIO (S3), and Nextcloud integration in the portal back office: instance model, proxy API, and configuration panels.

## Instance model

- **Table**: `public.tenant_app_instances`
- **Columns**: `id`, `tenant_id`, `app_type` (`flowise` | `n8n` | `minio` | `nextcloud`), `name` (e.g. `default`, `staging`, `prod`), `base_url`, `api_key_encrypted`, `settings` (jsonb), `created_at`, `updated_at`
- **Uniqueness**: `(tenant_id, app_type, name)` — multiple instances per tenant per app type are allowed (e.g. one Flowise "default" and one "staging" per org).
- **RLS**: Tenant members can select; tenant admins can insert/update/delete for their tenant; **platform_admin** can select/insert/update/delete any row (and list all tenants for the Add-instance form).

## Who can configure what

- **Platform admin** (`platform_role = platform_admin`): Can list all tenants and all app instances; can add/edit/remove any instance; can open Flowise, n8n, MinIO, and Nextcloud configuration panels for any instance (instance chosen by `instanceId` or `tenantId` + `appType` + `name` in the URL).
- **Tenant admin** (`is_tenant_admin(tenant_id)`): Can list and manage only that tenant’s instances; same configuration panels, scoped to that tenant’s instance(s). (Org-level “Provisions” under the dashboard can link to the same panels with tenant/instance pre-selected.)

## Secure API access (no keys in browser)

All Flowise and n8n API calls go through the portal backend:

- **Flowise proxy**: `/api/backoffice/flowise/[...path]` — forwards to `{instance.base_url}/api/v1/{path}` with `Authorization: Bearer {key}` and `x-api-key: {key}` (some Flowise versions accept either).
- **n8n proxy**: `/api/backoffice/n8n/[...path]` — forwards to `{instance.base_url}/api/v1/{path}` with `X-N8N-API-KEY: {instance.api_key_encrypted}`.

**Query params** (required for resolving the instance): `instanceId=<uuid>` **or** `instanceId=env-flowise` | `env-n8n` | `env-minio` | `env-nextcloud` (platform default from env) **or** `tenantId=<uuid>&appType=flowise|n8n|minio|nextcloud` and optionally `name=<string>` (default `default`). The proxy resolves the instance from the DB (or env when using env instance ids or when no row exists for tenant+appType), checks that the current user is platform_admin or tenant admin for that instance, then forwards the request (Flowise/n8n/Nextcloud) or runs S3 operations (MinIO). API keys are never sent to the client.

## Native env integration

- **Env as default**: `FLOWISE_URL`, `N8N_URL`, `MINIO_ENDPOINT` (or `S3_ENDPOINT_URL`), and their corresponding API keys (see portal `.env.example`) define the app’s native default Flowise, n8n, and MinIO instances. When a tenant has no `tenant_app_instances` row for a given app type, resolution falls back to this env-configured instance.
- **Resolution order**: For a given tenant and app type, the app first looks up `tenant_app_instances`; if no row is found, it uses the env default. Rows with `base_url` null are treated as “use platform default”: the resolver fills in URL and API key from env for that row (so “Add instance” can assign the env default to a tenant without storing secrets).
- **Platform default in back office**: When env is set, the Admin → App instances table shows “Platform default (env)” rows for Flowise, n8n, and MinIO. Configure opens the config panel with `instanceId=env-flowise`, `instanceId=env-n8n`, or `instanceId=env-minio`. Only platform_admin can use the env default instance; tenant admins only see and manage their tenant’s instances (DB or env-assigned).
- **Supabase as multitenant layer**: Supabase remains the source of truth for distribution (which tenant uses which instance or the env default) and access control (RLS, platform_admin vs tenant admin). The back office uses Flowise/n8n CRUD APIs via the proxy to manage configuration (chatflows, workflows, etc.) and distribution (create/update/delete instance rows).

## Credentials and Notion

Project secrets (Supabase keys, Flowise/n8n API keys, MinIO and Nextcloud credentials, etc.) are maintained in the **MOOD MNKY credentials database** in Notion. Use the **Notion plugin** to find, store, retrieve, and copy values into `supabase-mt/portal/.env.local` (or the repo root `.env.local` used by the portal) and other env files as needed. When adding or changing env vars for the back office or stack, update Notion and the repo’s **AGENT:TODO** ([AGENT-TODO.md](../../../AGENT-TODO.md) in the repo root), which lists all variables and the credential workflow.

## Admin UI

### Instance management (`/admin`)

- **App instances** card: Table of all instances. When env is configured, **Platform default (env)** rows for Flowise, n8n, MinIO, and Nextcloud appear (Configure only; no Remove). Then all DB-backed instances (tenant, app type, instance name, masked base URL) with Configure and Remove.
- **Add instance**: Dialog with tenant, app type (Flowise, n8n, MinIO, Nextcloud), instance name, optional **Use platform default (from env)** (writes a row with null base_url/api_key; resolver uses env at runtime), or custom base URL and optional API key. Writes to `tenant_app_instances`.

### Flowise configuration panel (`/admin/flowise?instanceId=...`)

- **Instance** selector line (current instance id; link back to Admin to change).
- **Tabs**: Chatflows | Assistants | Variables | Tools | Document Store.
  - **Chatflows**: List (GET), Create (dialog), Delete. Links to Flowise API docs.
  - **Assistants**: List, Delete.
  - **Variables / Tools / Document Store**: List (where the API supports it); create/edit in Flowise UI or via API as needed.

All list/create/delete requests use the proxy with `?instanceId=...` (or tenantId + appType + name).

**Troubleshooting**: If the proxy returns **502** with a message like "Flowise rejected the API key" or "n8n rejected the request", the upstream app returned 401 (invalid or missing API key).

- **Flowise**: Set `FLOWISE_API_KEY` in `.env.local` to the value from the **same** Flowise instance as `FLOWISE_URL`. For example, if `FLOWISE_URL=https://flowise-dev.moodmnky.com`, log in at that URL, go to **Settings → API Keys**, create or copy a key, and set `FLOWISE_API_KEY` to that value (the key from localhost or another instance will not work). The proxy also checks `FLOWISE_SECRETKEY` and `FLOWISE_APIKEY` if `FLOWISE_API_KEY` is unset. Restart the dev server after changing env. If the toast shows "Upstream: Unauthorized Access", the key is missing or not valid for that instance. On **Flowise v3+** with app-level email/password login, the Management API may require a JWT from login instead of a static API key; see [Flowise Auth](https://docs.flowiseai.com/configuration/authorization).
- **n8n**: Set `N8N_API_KEY` in `.env.local` to match n8n **Settings → API**. Restart the dev server.

### Definitive 502 debugging (Flowise)

Per [Flowise API Reference](https://docs.flowiseai.com/api-reference/chatflows), listing chatflows is a simple call: **GET /api/v1/chatflows** with **`Authorization: Bearer <your-api-key>`**. The dashboard API keys (Settings → API Keys) are sent as Bearer; see [Chatflow-level auth](https://docs.flowiseai.com/configuration/authorization/chatflow-level). If your instance uses [App-level Email & Password](https://docs.flowiseai.com/configuration/authorization/app-level) (v3.0.1+), the Management API may require a JWT from login instead of the static API key.

1. **Run the diagnostic**: As platform admin, open **GET /api/backoffice/flowise-debug**. It (a) confirms env is loaded (`flowiseKeySet`, `flowiseKeyLength`, `envLocation`), and (b) runs the **simple API call** above from the server and returns `simpleApiTest: { status, ok, message }`. If `simpleApiTest.status === 200`, the key works; if `401`, Flowise rejected the key or the instance requires JWT.
2. **Keys containing `/`**: If your API key contains a slash, quote it in `.env.local`: `FLOWISE_API_KEY="your-key"`.
3. **Restart**: Any change to `.env.local` requires restarting the dev server.
4. **Same instance**: The key must be from the Flowise instance at `FLOWISE_URL` (Settings → API Keys).
5. **502 response body**: The proxy returns `keySent`, `keyLength`, and `debugUrl: "/api/backoffice/flowise-debug"` so you can confirm what was sent and re-check the diagnostic.

### n8n configuration panel (`/admin/n8n?instanceId=...`)

- **Instance** selector line.
- **Tabs**: Workflows | Executions | Credentials.
  - **Workflows**: List (from n8n API), Delete.
  - **Executions**: List (from n8n API; may be limited).
  - **Credentials**: Info text; credentials are managed in n8n UI (API list/update may be limited).

### MinIO / S3 configuration panel (`/admin/minio?instanceId=...`)

- **Instance** selector line (`instanceId=env-minio` for platform default from env).
- **Tabs**: Buckets | Objects.
  - **Buckets**: List (GET `/api/backoffice/minio/buckets`), Create (POST with `{ name }`), Delete (bucket must be empty).
  - **Objects**: Select bucket, optional prefix, then list objects (GET `.../buckets/:bucket/objects?prefix=&maxKeys=`), Upload (POST form with `key` + `file`), Download (GET `.../buckets/:bucket/objects/:key`), Delete (DELETE `.../buckets/:bucket/objects/:key`).

**MinIO credentials (env default)**  
Set in `supabase-mt/.env.local`: `MINIO_ENDPOINT` (or `S3_ENDPOINT_URL`), `MINIO_ROOT_USER` (or `S3_STORAGE_ACCESS_KEY_ID`), `MINIO_ROOT_PASSWORD` (or `S3_STORAGE_SECRET_ACCESS_KEY`). Optional: `S3_STORAGE_REGION` (default `us-east-1`), `S3_FORCE_PATH_STYLE=true` for MinIO. The back office uses `@aws-sdk/client-s3` with these credentials; keys are never sent to the client.

### Nextcloud configuration panel (`/admin/nextcloud?instanceId=...`)

- **Instance** selector line (`instanceId=env-nextcloud` for platform default from env).
- **Tabs**: Users | Capabilities | Apps.
  - **Users**: List user IDs (OCS `GET /ocs/v1.php/cloud/users`, admin-only).
  - **Capabilities**: Server version and capabilities (OCS `GET /ocs/v1.php/cloud/capabilities`).
  - **Apps**: List installed app IDs (OCS `GET /ocs/v1.php/cloud/apps`).

**Nextcloud credentials (env default)**  
Set in `supabase-mt/.env.local`: `NEXTCLOUD_URL`, `NEXTCLOUD_ADMIN_USER`, and `NEXTCLOUD_ADMIN_PASSWORD` (or `NEXTCLOUD_ADMIN_APP_PASSWORD` for app password). The proxy sends Basic Auth and `OCS-APIRequest: true`; responses are requested with `format=json`. For DB-backed instances, store username in the instance and `nextcloud_password` in `settings` (or use env default).

## API surface (proxy path → upstream)

| Proxy path | Upstream (Flowise) | Upstream (n8n) |
|------------|--------------------|----------------|
| `GET/POST /api/backoffice/flowise/chatflows?...` | `GET/POST /api/v1/chatflows` | — |
| `GET/PUT/DELETE /api/backoffice/flowise/chatflows/:id?...` | `GET/PUT/DELETE /api/v1/chatflows/:id` | — |
| `GET/DELETE /api/backoffice/flowise/assistants?...` | `GET/DELETE /api/v1/assistants` | — |
| `GET /api/backoffice/flowise/variables?...` | `GET /api/v1/variables` | — |
| `GET /api/backoffice/n8n/workflows?...` | — | `GET /api/v1/workflows` |
| `DELETE /api/backoffice/n8n/workflows/:id?...` | — | `DELETE /api/v1/workflows/:id` |
| `GET /api/backoffice/n8n/executions?...` | — | `GET /api/v1/executions` |

**MinIO (S3-compatible)** — server-side S3 client; no HTTP proxy. All routes require `?instanceId=env-minio` (or a DB instance id).

| Portal route | Operation |
|--------------|-----------|
| `GET /api/backoffice/minio/buckets?instanceId=...` | ListBuckets |
| `POST /api/backoffice/minio/buckets` (body `{ name }`) | CreateBucket |
| `GET /api/backoffice/minio/buckets/:bucket?instanceId=...` | HeadBucket |
| `DELETE /api/backoffice/minio/buckets/:bucket?instanceId=...` | DeleteBucket |
| `GET /api/backoffice/minio/buckets/:bucket/objects?prefix=&maxKeys=&continuationToken=` | ListObjectsV2 |
| `POST /api/backoffice/minio/buckets/:bucket/objects` (form: key, file) | PutObject |
| `GET /api/backoffice/minio/buckets/:bucket/objects/...key?instanceId=...` | GetObject (download) |
| `HEAD /api/backoffice/minio/buckets/:bucket/objects/...key?instanceId=...` | HeadObject |
| `DELETE /api/backoffice/minio/buckets/:bucket/objects/...key?instanceId=...` | DeleteObject |

**Nextcloud (OCS API)** — proxy forwards to `{NEXTCLOUD_URL}/ocs/v1.php/cloud/{path}` with Basic Auth and `OCS-APIRequest: true`. `format=json` is added by the proxy.

| Portal route | Upstream |
|--------------|----------|
| `GET /api/backoffice/nextcloud/users?instanceId=...` | `GET /ocs/v1.php/cloud/users` |
| `GET /api/backoffice/nextcloud/users/:id?instanceId=...` | `GET /ocs/v1.php/cloud/users/:id` |
| `GET /api/backoffice/nextcloud/capabilities?instanceId=...` | `GET /ocs/v1.php/cloud/capabilities` |
| `GET /api/backoffice/nextcloud/apps?instanceId=...` | `GET /ocs/v1.php/cloud/apps` |

Additional Flowise/n8n/Nextcloud endpoints can be added by calling the same proxy with the desired path (e.g. `/api/backoffice/flowise/tools?...`, `/api/backoffice/nextcloud/...`).

## Dashboard and tenant pages

- **Dashboard** (`/dashboard`): Resolves the default instance per tenant per app via `getInstanceForTenantOrEnv(tenantId, appType, 'default')` (DB first, then env fallback) to show Flowise/n8n links and provision counts.
- **Tenant page** (`/t/[slug]`): Same; uses the default instance for that tenant (DB or env) to show Open Flowise / Open n8n buttons.

## Optional: org-level Provisions

Under the partner dashboard, when `activeTeam.type === 'org'` and the user is a tenant admin, a “Provisions” or “Integrations” section can list that org’s instances and link to the same Flowise/n8n configuration panels with `tenantId` and `appType` (and optional `name`) pre-filled, so tenant admins manage their instances without going to `/admin`.
