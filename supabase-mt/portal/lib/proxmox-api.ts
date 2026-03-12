/** Shared types and helpers for Proxmox VE API responses (portal proxy). */

export type PveVersion = {
  data?: { version?: string; release?: string; repoid?: string };
};

export type PveClusterStatus = {
  data?: { name?: string; quorum?: number; nodes?: number }[];
};

export type PveClusterResource = {
  id?: string;
  type?: string;
  node?: string;
  name?: string;
  status?: string;
  vmid?: number;
  maxcpu?: number;
  maxmem?: number;
  mem?: number;
  maxdisk?: number;
  disk?: number;
  uptime?: number;
  /** CPU usage 0–1 (multiply by 100 for %) */
  cpu?: number;
  /** Allocated cores (may equal maxcpu) */
  cpus?: number;
  template?: number;
  swap?: number;
  maxswap?: number;
  netin?: number;
  netout?: number;
  diskread?: number;
  diskwrite?: number;
};

export type PveClusterResources = { data?: PveClusterResource[] };

export type PveNode = {
  node?: string;
  status?: string;
  cpu?: number;
  maxmem?: number;
  mem?: number;
  maxcpu?: number;
  disk?: number;
  maxdisk?: number;
  uptime?: number;
  ssl_fingerprint?: string;
};

export type PveNodes = { data?: PveNode[] };

export type PveNodeStatus = {
  data?: {
    node?: string;
    status?: string;
    cpuinfo?: string;
    mem?: number;
    total?: number;
    uptime?: number;
    loadavg?: number[];
    rootfs?: { used?: number; total?: number; avail?: number };
  };
};

/** GET /cluster/tasks */
export type PveClusterTask = {
  upid?: string;
  node?: string;
  type?: string;
  id?: string;
  user?: string;
  starttime?: number;
  endtime?: number;
  status?: string;
  pid?: number;
  pstart?: number;
};

export type PveClusterTasks = { data?: PveClusterTask[] };

/** GET /cluster/log */
export type PveClusterLogEntry = {
  n?: number;
  t?: number | string;
  msg?: string;
  tag?: string;
  user?: string;
  pid?: string;
  id?: string;
  node?: string;
  pri?: number;
};

export type PveClusterLog = { data?: PveClusterLogEntry[] };

/** GET /nodes/{node}/rrddata?timeframe=hour&cf=AVERAGE&ds=cpu (etc.) */
export type PveRrdData = {
  data?: {
    t?: number[];
    cpu?: number[];
    load?: number[];
    mem?: number[];
    maxmem?: number[];
    netin?: number[];
    netout?: number[];
    [key: string]: number[] | undefined;
  };
};

export type PveStorage = {
  storage?: string;
  type?: string;
  active?: number;
  content?: string;
  used?: number;
  total?: number;
  avail?: number;
  shared?: number;
  used_fraction?: number;
};

export type PveNodeStorage = { data?: PveStorage[] };

/** GET /nodes/{node}/storage/{storage}/content */
export type PveStorageContentItem = {
  volid?: string;
  content?: string;
  format?: string;
  size?: number;
  used?: number;
  vmid?: number | string;
  parent?: string | null;
  [key: string]: unknown;
};

export type PveStorageContent = { data?: PveStorageContentItem[] };

export function formatBytes(n: number): string {
  if (n === 0) return "0 B";
  const k = 1024;
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${parseFloat((n / Math.pow(k, i)).toFixed(2))} ${["B", "KB", "MB", "GB", "TB"][i]}`;
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Format CPU usage (0–1 from API) as percentage string. */
export function formatCpuPct(cpu: number | undefined | null): string {
  if (cpu == null || Number.isNaN(cpu)) return "—";
  const pct = cpu <= 1 ? cpu * 100 : cpu;
  return `${Number(pct).toFixed(1)}%`;
}

export const PROXMOX_PROXY = "/api/backoffice/proxmox";
