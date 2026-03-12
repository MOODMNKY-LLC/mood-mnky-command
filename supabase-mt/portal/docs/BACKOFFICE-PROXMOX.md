# Proxmox back office (portal dashboard)

The portal exposes a **Proxmox dashboard** for platform admins: cluster overview, nodes, VMs/LXCs, and storage. The dashboard uses a server-side proxy so credentials never reach the browser.

## Purpose

- View cluster version, quorum, and node count.
- Inspect each node: status, CPU, memory, disk, uptime.
- List all VMs and LXCs across the cluster.
- View per-node storage (type, content, used/total/avail).
- Use alongside Ansible and [provisioning runbooks](../../provisioning/README.md) for creating VMs and deploying the MOOD MNKY stack.

## Required environment variables

Set in `supabase-mt/.env.local` (or the env file loaded when running the portal from `supabase-mt/portal`):

| Variable | Required | Description |
|----------|----------|-------------|
| `PROXMOX_API_HOST` | Yes | Proxmox host (e.g. `10.0.0.10:8006` for LAN, or `proxmox-data.moodmnky.com` for Vercel). No `https://` prefix; proxy uses HTTPS for hostnames without a scheme. |
| `PROXMOX_API_TOKEN_ID` | Prefer | API token ID (e.g. `user@pam!tokenid`). From Datacenter → Permissions → API Tokens. |
| `PROXMOX_API_TOKEN_SECRET` | Prefer | Token secret (shown once at creation). |
| `PROXMOX_API_USER` | Fallback | Username with realm (e.g. `root@pam`) when not using a token. |
| `PROXMOX_API_PASSWORD` | Fallback | Password for ticket-based auth. |

**Auth behavior:** The proxy prefers **token auth** (stateless). If token is not set, it uses **ticket auth** (POST to `/access/ticket` with user/password; ticket is cached for ~55 minutes). Ticket auth gives full access as that user (e.g. root); token can have restricted privileges depending on how it was created.

## Access control

- Only users with **platform_admin** can open the Proxmox dashboard and call the proxy.
- The API route `/api/backoffice/proxmox/[...path]` checks `platform_role === "platform_admin"` and returns 403 otherwise.

## TLS and hosts

- **Self-signed certificates:** If the Proxmox host uses a self-signed cert, Node’s `fetch` may reject the connection. For **development** you can set `NODE_TLS_REJECT_UNAUTHORIZED=0`. Use only in a trusted environment.
- **Subdomain (e.g. proxmox-data.moodmnky.com):** Use this host for Vercel or when the portal runs on a different network. The proxy uses HTTPS. Verified with token auth (version, cluster/status).
- **Windows local dev:** On Windows, Node may fail with a certificate **revocation check** error (e.g. `CRYPT_E_NO_REVOCATION_CHECK`) when calling the subdomain. Deploying on Vercel (Linux) avoids this. For local testing against the subdomain you can set `NODE_TLS_REJECT_UNAUTHORIZED=0` (dev only).

## API endpoints used by the dashboard

The dashboard calls these Proxmox API paths via the proxy:

- `GET /version` — version and release
- `GET /cluster/status` — quorum and cluster info
- `GET /cluster/resources` — nodes, VMs, LXCs, storage (filter with `?type=vm` etc.)
- `GET /nodes` — list nodes
- `GET /nodes/{node}/status` — node status and resources
- `GET /nodes/{node}/storage` — storage list for the node

See [Proxmox VE API](https://pve.proxmox.com/wiki/Proxmox_VE_API) and the [API viewer](https://pve.proxmox.com/pve-docs/api-viewer/index.html) for the full surface.

## Links

- [AGENT-TODO.md](../../AGENT-TODO.md) — env matrix and credential workflow
- [provisioning/README.md](../../provisioning/README.md) — Ansible playbooks and Proxmox env vars for create VM / deploy stack
