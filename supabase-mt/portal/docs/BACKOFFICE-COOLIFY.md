# Coolify back office (portal app instance)

The portal integrates **Coolify** as a first-class back office app instance. Platform admins can view servers, projects, and deployments via the portal proxy; credentials stay server-side.

## Purpose

- Manage Coolify alongside Flowise, n8n, MinIO, and Nextcloud in **Admin → App instances**.
- Use a **platform default** instance from env (`COOLIFY_URL` / `COOLIFY_API_KEY`) or register per-tenant Coolify instances in the database.
- Open **Admin → Coolify** (or Configure on a Coolify instance) to list servers, projects, and deployments through the Coolify API.

## Required environment variables

Set in `supabase-mt/.env.local` (or the env file loaded when running the portal from `supabase-mt/portal`):

| Variable | Required | Description |
|----------|----------|-------------|
| `COOLIFY_URL` | For default instance | Coolify base URL (e.g. `http://10.0.0.115:8000` locally, `https://coolify-hq.moodmnky.com` in production). |
| `COOLIFY_API_HOST` | Fallback | If `COOLIFY_URL` is not set, the proxy builds the URL as `https://${COOLIFY_API_HOST}` (e.g. `coolify-hq.moodmnky.com`). |
| `COOLIFY_API_KEY` | Yes (for API) | API token from Coolify UI → Keys & Tokens → API tokens. Sent as `Authorization: Bearer <key>`. |

**Instance ID:** The env-based default is exposed as `env-coolify`. Use `?instanceId=env-coolify` when calling the Coolify proxy or opening the Coolify config panel.

## Access control

- **Platform default** (`env-coolify`, `tenant_id === null`): only **platform_admin** can access.
- **Tenant-specific instances**: platform_admin or tenant admin for that tenant can access.
- The API route `/api/backoffice/coolify/[...path]` resolves the instance (from `instanceId` or `tenantId` + `appType`), checks `canAccessInstance`, then forwards to Coolify with Bearer auth.

## API endpoints used

The Coolify config panel and any direct proxy calls use the Coolify API base path `/api/v1`. The portal proxy forwards:

- `GET /api/backoffice/coolify/servers?instanceId=...` → Coolify `GET /api/v1/servers`
- `GET /api/backoffice/coolify/projects?instanceId=...` → Coolify `GET /api/v1/projects`
- `GET /api/backoffice/coolify/deployments?instanceId=...` → Coolify `GET /api/v1/deployments`

Other Coolify API paths (e.g. create project, trigger deploy) can be added to the panel or called via the same proxy pattern.

See [Coolify API reference](https://coolify.io/docs/api-reference/api) for the full surface.

## TLS and hosts

- **Self-signed or custom certs:** If the Coolify host uses a cert that Node does not trust, `fetch` may reject the connection. For **development** you can set `NODE_TLS_REJECT_UNAUTHORIZED=0` in a trusted environment only.
- **Windows local dev:** On Windows, Node may fail with a certificate **revocation check** error (e.g. `CRYPT_E_NO_REVOCATION_CHECK`) when calling a Coolify host over HTTPS. Deploying the portal on Vercel (Linux) avoids this. For local testing you can set `NODE_TLS_REJECT_UNAUTHORIZED=0` (dev only) or use HTTP to a local Coolify instance (e.g. `http://10.0.0.115:8000`).
- **Production:** Set `COOLIFY_URL` (e.g. `https://coolify-hq.moodmnky.com`) in Vercel (or your production env) so the portal can reach Coolify from the server.

## Multi-tenant deployment (Phase 2)

Coolify can be used alongside or instead of Ansible + Proxmox for full-stack deployments:

- **Current:** Partners request a stack via the portal; a platform admin runs Ansible playbooks to create a VM on Proxmox and deploy the Docker Compose stack (see [provisioning/README.md](../../provisioning/README.md)).
- **With Coolify:** The platform can create a Coolify project per tenant (or per `tenant_stack_subscriptions` row), deploy the same stack via Coolify on designated servers, and optionally store `coolify_project_uuid` or `coolify_server_uuid` on the subscription for traceability. This is optional and can be implemented in a follow-up (schema migration + UI).

## Links

- [AGENT-TODO.md](../../AGENT-TODO.md) — env matrix and Coolify variables
- [BACKOFFICE-PROXMOX.md](./BACKOFFICE-PROXMOX.md) — Proxmox dashboard and TLS notes
- [provisioning/README.md](../../provisioning/README.md) — Ansible + Proxmox for stack provisioning
