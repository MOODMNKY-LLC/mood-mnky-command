/**
 * Proxmox VE API client — server-side only.
 * Uses PROXMOX_BASE_URL and PROXMOX_API_TOKEN from env.
 * Optional: PROXMOX_TOKEN_ID (e.g. code-mnky@pam!mnky-api) — if set, full token is TOKEN_ID=API_TOKEN.
 */

const BASE_URL = process.env.PROXMOX_BASE_URL ?? ""
const API_TOKEN_RAW = process.env.PROXMOX_API_TOKEN ?? ""
const TOKEN_ID = process.env.PROXMOX_TOKEN_ID ?? ""
// Proxmox expects PVEAPIToken=user@realm!tokenid=secret
const API_TOKEN = TOKEN_ID
  ? `${TOKEN_ID}=${API_TOKEN_RAW}`
  : API_TOKEN_RAW

export interface ProxmoxApiError {
  code: string
  message: string
  details?: unknown
}

export function getProxmoxConfig(): { baseUrl: string; token: string } {
  return { baseUrl: BASE_URL, token: API_TOKEN }
}

export function isProxmoxConfigured(): boolean {
  return Boolean(BASE_URL && API_TOKEN)
}

async function proxmoxFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T }> {
  if (!BASE_URL || !API_TOKEN) {
    throw new Error("PROXMOX_BASE_URL and PROXMOX_API_TOKEN must be set")
  }
  const url = `${BASE_URL.replace(/\/$/, "")}/api2/json${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `PVEAPIToken=${API_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    // Optional: for self-signed certs, caller can set NODE_TLS_REJECT_UNAUTHORIZED=0 in dev
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = (json as { data?: ProxmoxApiError })?.data ?? {
      code: "PROXMOX_ERROR",
      message: res.statusText || "Proxmox API error",
    }
    throw new Error(JSON.stringify(err))
  }
  return json as { data: T }
}

/** GET /cluster/status — quorum and nodes list */
export async function getClusterStatus(): Promise<{
  quorum?: { quorum: number }
  node_list?: { node: string; id: string; status: string }[]
}> {
  const out = await proxmoxFetch<unknown[]>("/cluster/status")
  type ClusterStatusItem = {
    type?: string
    node?: string
    name?: string
    id?: string
    status?: string
    quorum?: number
    online?: number
  }
  const items: ClusterStatusItem[] = Array.isArray(out.data) ? (out.data as ClusterStatusItem[]) : []
  const quorumRaw = items.find((i) => i?.type === "quorum")
  const quorum: { quorum: number } | undefined =
    quorumRaw && typeof quorumRaw.quorum === "number"
      ? { quorum: quorumRaw.quorum }
      : undefined
  const nodeList = items.filter((i) => i?.type === "node")
  return {
    quorum,
    node_list: nodeList.map((n) => {
      const nodeName = n.node ?? n.name ?? (typeof n.id === "string" ? n.id.replace(/^node\//, "") : "unknown")
      const nodeId = n.id ?? `node/${nodeName}`
      const status = n.online === 1 ? "online" : n.online === 0 ? "offline" : (n.status ?? "unknown")
      return {
        node: nodeName,
        id: nodeId,
        status,
      }
    }),
  }
}

/** GET /nodes — list nodes with status */
export async function getNodes(): Promise<
  { node: string; status: string; cpu?: number; mem?: number; maxmem?: number; uptime?: number }[]
> {
  const out = await proxmoxFetch<{ data?: unknown[] }>("/nodes")
  const list = Array.isArray(out.data?.data) ? out.data.data : []
  return list as {
    node: string
    status: string
    cpu?: number
    mem?: number
    maxmem?: number
    uptime?: number
  }[]
}

/** GET /nodes/{node}/status — single node resources */
export async function getNodeStatus(
  node: string
): Promise<{
  node: string
  status: string
  cpu?: number
  mem?: number
  maxmem?: number
  uptime?: number
}> {
  const out = await proxmoxFetch<Record<string, unknown>>(
    `/nodes/${encodeURIComponent(node)}/status`
  )
  return out.data as {
    node: string
    status: string
    cpu?: number
    mem?: number
    maxmem?: number
    uptime?: number
  }
}

/** GET /cluster/resources — cluster-wide VMs and LXC (guests) */
export async function getClusterResources(): Promise<
  {
    node: string
    vmid: number
    name: string
    type: "qemu" | "lxc"
    status: string
    maxmem?: number
    maxdisk?: number
    mem?: number
    disk?: number
    cpu?: number
    maxcpu?: number
    storage?: string
    hostname?: string
  }[]
> {
  const out = await proxmoxFetch<{ data?: unknown[] }>("/cluster/resources?type=vm")
  const list = Array.isArray(out.data?.data) ? out.data.data : []
  return list as {
    node: string
    vmid: number
    name: string
    type: "qemu" | "lxc"
    status: string
    maxmem?: number
    maxdisk?: number
    mem?: number
    disk?: number
    cpu?: number
    maxcpu?: number
    storage?: string
    hostname?: string
  }[]
}

/** Guest status/current response (QEMU/LXC) */
export interface GuestStatusCurrent {
  status: string
  uptime?: number
  netin?: number
  netout?: number
  cpus?: number
  cpu?: number
  mem?: number
  maxmem?: number
  disk?: number
  maxdisk?: number
  [k: string]: unknown
}

/** GET /nodes/{node}/qemu/{vmid}/status or /nodes/{node}/lxc/{vmid}/status */
export async function getGuestStatus(
  node: string,
  vmid: string,
  type: "qemu" | "lxc"
): Promise<GuestStatusCurrent> {
  const sub = type === "qemu" ? "qemu" : "lxc"
  const out = await proxmoxFetch<Record<string, unknown>>(
    `/nodes/${encodeURIComponent(node)}/${sub}/${encodeURIComponent(vmid)}/status/current`
  )
  return out.data as GuestStatusCurrent
}

/** Format uptime seconds to human-readable (e.g. "12d 3h" or "45m") */
export function formatUptime(seconds: number | undefined | null): string {
  if (seconds == null || seconds < 0) return "—"
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ${m % 60}m`
  const d = Math.floor(h / 24)
  return `${d}d ${h % 24}h`
}

/** Format bytes to human-readable (e.g. "1.2 GB") */
export function formatBytes(bytes: number | undefined | null): string {
  if (bytes == null || bytes < 0) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

/** GET /cluster/resources — all types; filter for storage */
export interface ClusterStorageItem {
  storage: string
  node?: string
  type?: string
  content?: string
  used?: number
  total?: number
  avail?: number
  disk?: number
  maxdisk?: number
}

export async function getClusterStorage(): Promise<ClusterStorageItem[]> {
  const out = await proxmoxFetch<{ data?: unknown[] }>("/cluster/resources")
  const list = Array.isArray(out.data?.data) ? out.data.data : []
  return list
    .filter((i): i is Record<string, unknown> => typeof i === "object" && i !== null)
    .filter((i) => i.type === "storage")
    .map((i) => ({
      storage: String(i.storage ?? ""),
      node: i.node != null ? String(i.node) : undefined,
      type: i.type != null ? String(i.type) : undefined,
      content: i.content != null ? String(i.content) : undefined,
      used: typeof i.used === "number" ? i.used : typeof i.disk === "number" ? i.disk : undefined,
      total: typeof i.total === "number" ? i.total : typeof i.maxdisk === "number" ? i.maxdisk : undefined,
      avail: typeof i.avail === "number" ? i.avail : undefined,
      disk: typeof i.disk === "number" ? i.disk : undefined,
      maxdisk: typeof i.maxdisk === "number" ? i.maxdisk : undefined,
    }))
}

/** GET /cluster/tasks — recent cluster tasks */
export interface ClusterTaskItem {
  id: string
  node?: string
  type?: string
  status?: string
  starttime?: number
  endtime?: number
  idlist?: string
  [k: string]: unknown
}

export async function getClusterTasks(limit = 20): Promise<ClusterTaskItem[]> {
  const out = await proxmoxFetch<{ data?: unknown[] }>(`/cluster/tasks?limit=${limit}`)
  const list = Array.isArray(out.data?.data) ? out.data.data : []
  return list as ClusterTaskItem[]
}
