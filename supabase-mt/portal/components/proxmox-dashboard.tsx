"use client";

import { ProxmoxOverview } from "@/components/proxmox/proxmox-overview";

/**
 * Legacy export: full Proxmox dashboard is now split into dedicated routes
 * (/dashboard/proxmox, /cluster, /nodes, /vms, /storage). This component
 * renders the overview only for backward compatibility.
 */
export function ProxmoxDashboard() {
  return <ProxmoxOverview />;
}
