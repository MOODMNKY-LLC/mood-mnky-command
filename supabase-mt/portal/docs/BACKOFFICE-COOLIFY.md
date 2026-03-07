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
| `APP_FACTORY_ROOT_DOMAIN` | Required for platform URL | Root domain for subdomain derivation (e.g. `moodmnky.com`). When set: (a) the Launch Wizard shows the app URL as `https://<slug>.<root>` and does not ask for a full domain; (b) the pipeline sends `domains: <slug>.<root>` to Coolify; (c) the pipeline sets `NEXT_PUBLIC_ROOT_DOMAIN` and `NEXT_PUBLIC_APP_URL` on the Coolify application via the API so the deployed app uses the real domain instead of localhost. If unset, the pipeline can still deploy but Coolify may assign a random subdomain and the deployed app may show localhost until env is set manually. Requires wildcard DNS (see below). |
| `APP_FACTORY_TEMPLATE_PATH` | Optional | Path to a local Next.js template. If set and the path exists, the generator copies this tree instead of the minimal stub. Default: resolved from `template_registry.source_path` (e.g. `infra/templates/nextjs/platforms`) or fallback `temp/platforms`. |
| `APP_FACTORY_COOLIFY_PROJECT_NAME` | Optional | Coolify project name used when the deployment spec does not set `coolify_project_uuid` (e.g. "MOOD MNKY Portal"). The portal resolves this name via the Coolify API (list projects) and deploys to that project. If unset, the first project returned by the API is used. |

**Instance ID:** The env-based default is exposed as `env-coolify`. Use `?instanceId=env-coolify` when calling the Coolify proxy or opening the Coolify config panel.

## Access control

- **Platform default** (`env-coolify`, `tenant_id === null`): only **platform_admin** can access.
- **Tenant-specific instances**: platform_admin or tenant admin for that tenant can access.
- The API route `/api/backoffice/coolify/[...path]` resolves the instance (from `instanceId` or `tenantId` + `appType`), checks `canAccessInstance`, then forwards to Coolify with Bearer auth.

## API endpoints used

The Coolify config panel and any direct proxy calls use the Coolify API base path `/api/v1`. The portal proxy forwards:

| Portal (GET) | Coolify API | Panel tab |
|--------------|-------------|-----------|
| `.../coolify/servers?instanceId=...` | `GET /api/v1/servers` | Servers |
| `.../coolify/projects?instanceId=...` | `GET /api/v1/projects` | Projects |
| `.../coolify/applications?instanceId=...` | `GET /api/v1/applications` | Applications (name, status, fqdn, git, branch) |
| `.../coolify/databases?instanceId=...` | `GET /api/v1/databases` | Databases |
| `.../coolify/resources?instanceId=...` | `GET /api/v1/resources` | Resources |
| `.../coolify/deployments?instanceId=...` | `GET /api/v1/deployments` | Deployments (application, server, status, commit, URL, created) |

- **Applications** supports optional `?tag=...` (filter by tag); the panel uses the list without tag by default.
- **Environments** are per-project: `GET /api/v1/projects/{uuid}/environments`. Not yet in the panel; can be added as expandable rows in Projects or a dedicated view.
- Other Coolify API paths (e.g. create project, trigger deploy, get server by UUID) can be called via the same proxy pattern.

## App Factory: default environment

The **App Factory** (launch pipeline) creates Coolify applications from a deployment spec. If the spec does not set `coolify_environment_uuid`, the portal sends `environment_name: "production"` so Coolify uses the **default production environment** for the chosen project. No extra setup is required for that case.

**Using a different environment (e.g. staging):**

1. In Coolify, open the **project** you use for App Factory deployments.
2. Go to the project’s **Environments** (or use the API: `GET /api/v1/projects/{project_uuid}/environments`).
3. Create or note the environment you want (e.g. "staging") and copy its **UUID**.
4. In the deployment spec (or in the launch wizard when we support env selection), set `coolify_environment_uuid` to that UUID. When set, the portal sends `environment_uuid` instead of `environment_name`, so Coolify deploys to that environment.

If you only use the default production environment, leave `coolify_environment_uuid` unset and the portal will keep using `environment_name: "production"`.

## One public IP: domains vs host ports

With a single public IP, multiple Coolify apps on the same server need either **domain-based routing** or **different host ports**.

**Recommended: domains per app (subdomain-per-app)**

- Set a **domain** per app in the deployment spec (`app_metadata.domain`, e.g. `tenant-a.moodmnky.com`, `tenant-b.moodmnky.com`), or leave domain empty and set **`APP_FACTORY_ROOT_DOMAIN`** (e.g. `moodmnky.com`) so the pipeline derives `<slug>.<root>` (e.g. `my-app.moodmnky.com`) automatically.
- **Wildcard DNS:** Point `*.moodmnky.com` (or your root) at the Coolify server’s public IP. In Coolify, you can set the server’s **Wildcard Domain** in Server settings so Coolify knows the base for autogenerated domains.
- Coolify’s proxy (Traefik/Caddy) listens on 80/443 and routes by hostname to each app’s container port (3000). No per-app host port needed; one IP is enough.

**Alternative: host port per app**

- If you can’t use domains and need to reach apps by `IP:port`, assign a **unique host port per tenant/project** in the deployment spec: `deployment.coolify_host_port` (e.g. `3001`, `3002`, …).
- The portal sends `ports_mappings: "<host_port>:3000"` so each app is reachable at `http://<public_ip>:3001`, `http://<public_ip>:3002`, etc.
- Note: using `ports_mappings` disables some Coolify features (e.g. rolling updates). Prefer domains when possible.

See [Coolify API reference](https://coolify.io/docs/api-reference/api) for the full surface. For **custom subdomains** (why a random subdomain might be used instead of the one from the deployment spec), see [APP-FACTORY-COOLIFY-DOMAINS.md](./APP-FACTORY-COOLIFY-DOMAINS.md) — it links to the official Create (Public) application schema (`domains`, `autogenerate_domain`, `force_domain_override`) and known API issues.

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
