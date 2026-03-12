---
title: Cluster Dashboard
agent: code-mnky
description: "Proxmox cluster dashboard in the CODE MNKY app — routes, API, and UI"
---

# Cluster Dashboard (CODE MNKY App)

<div className="code-mnky-section p-4 rounded-lg mb-6">
The cluster dashboard is a Proxmox-backed feature in the CODE MNKY Next.js app. It shows cluster status, nodes, and guests (VMs and LXC) using the project's Proxmox API client and design system.
</div>

## Routes

| Route | Purpose |
|-------|---------|
| `/cluster` | Cluster overview: name, quorum, cluster RAM, guest counts (VMs/LXC), node cards (status, CPU, memory, guest count, uptime), Storage table, Recent activity (tasks) |
| `/cluster/guests` | All guests table with optional filters (node, type, status) via query params; includes Usage column (CPU %, memory used) |
| `/cluster/guests/[node]/[vmid]` | Single guest detail: status, CPU %, memory and disk used/total, Live section (uptime, network in/out) |
| `/cluster/nodes/[node]` | Node detail: status, CPU, memory, uptime, guest count; list of guests on that node |

All routes live under `apps/code-mnky/app/(main)/cluster/`. Layout and styling use the app’s main glass panel cards and design system.

## Proxmox Integration

- **Client**: `apps/code-mnky/lib/proxmox/client.ts`
- **API route**: `GET /api/proxmox/cluster/status` (used by the cluster page for status and node list)
- **Data**: Node list comes from Proxmox `GET /api2/json/cluster/status`; node names are derived from `node` (when present) or `name` or by stripping the `node/` prefix from `id` so that list keys and display values are stable.

### Client functions and helpers

- **getClusterStatus**, **getNodes**, **getNodeStatus**, **getClusterResources**, **getGuestStatus** — existing.
- **getClusterStorage()** — `GET /cluster/resources` filtered for `type === 'storage'`; returns storage name, node, used/total/avail (or disk/maxdisk).
- **getClusterTasks(limit)** — `GET /cluster/tasks?limit=N`; returns recent cluster tasks (type, status, node, starttime). If the API returns 403, the cluster page hides the section.
- **GuestStatusCurrent** — typed return for guest status/current (status, uptime, netin, netout, cpus, cpu, mem, maxmem, disk, maxdisk).
- **formatUptime(seconds)** — e.g. `"12d 3h"` or `"45m"`.
- **formatBytes(bytes)** — e.g. `"1.2 GB"`.

### Environment

- `PROXMOX_BASE_URL` — Proxmox API base URL
- `PROXMOX_API_TOKEN` — API token secret
- `PROXMOX_TOKEN_ID` — Token ID (e.g. `code-mnky@pam!...`); when set, the client sends `Authorization: PVEAPIToken=${PROXMOX_TOKEN_ID}=${PROXMOX_API_TOKEN}`
- Optional: `NODE_TLS_REJECT_UNAUTHORIZED=0` for dev with self-signed certs

See `docs/PROXMOX-API-TOKEN-PERMISSIONS.md` for granting the token access (e.g. PVEAdmin on path `/`).

## React List Key Fix

The cluster overview renders a list of nodes. Each item **must** have a unique, stable `key`. The Proxmox API returns node entries with `name`, `id` (e.g. `"node/CODE-MNKY"`), and sometimes `node`. The client normalizes to a `node` field (node name) and `id`; the UI uses:

- `key={n.id ?? n.node ?? \`node-${index}\`}`

so keys are never undefined and React does not warn about duplicate keys. The same pattern is used for guest lists (`key={\`${g.node}-${g.vmid}\`}`).

## Guests Page Filters

The guests page supports URL-based filters so links and bookmarks stay consistent:

- `?node=CODE-MNKY` — only guests on that node
- `?type=qemu` or `?type=lxc` — filter by type
- `?status=running` (or other status) — filter by status

Filters can be combined. The page shows pill-style links for “All”, each node, type (qemu, lxc), and status; the active filter is visually highlighted. The table includes a **Usage** column (live CPU % and memory used from cluster/resources when available).

## Storage and Recent activity

- **Storage**: The cluster page fetches `getClusterStorage()` and, when available, shows a **Storage** section: table of storage pools (name, node, used, total, avail) with human-readable sizes.
- **Recent activity**: The cluster page fetches `getClusterTasks(20)`. When available, a **Recent activity** section lists the latest tasks (type, status, node, start time). If the tasks API returns 403 (permissions), the section is hidden.

## Node and Guest Detail

- **Node page**: Back link to cluster, status/CPU/memory/uptime cards, guest count in header; “Guests on this node” list with a “View in guests list →” link to `/cluster/guests?node=<node>`.
- **Guest detail**: Status, CPU % (and cores), memory and disk used/total, storage name; optional **Live** section (uptime, network in/out from `getGuestStatus`). Reuses the same StatusPill and card styling; linked from the guests table and from node guest lists.

## Loading and Error States

- **Cluster**: `app/(main)/cluster/loading.tsx` shows a skeleton grid of six node-style cards while data loads.
- **Not configured**: If Proxmox env vars are missing, cluster and guests show a short message and a link to configuration docs.
- **API errors**: Failures from the Proxmox client are surfaced in the card description (e.g. permission or network errors).

## Related Docs

- **Proxmox token permissions**: `docs/PROXMOX-API-TOKEN-PERMISSIONS.md`
- **Design system**: `docs/DESIGN-SYSTEM.md`
- **Env template**: `.env.example` (Proxmox variables)
