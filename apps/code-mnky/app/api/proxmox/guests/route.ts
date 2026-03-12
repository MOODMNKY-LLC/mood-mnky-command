import { NextResponse } from "next/server"
import { isProxmoxConfigured, getClusterResources } from "@/lib/proxmox/client"

export const dynamic = "force-dynamic"

export async function GET() {
  if (!isProxmoxConfigured()) {
    return NextResponse.json(
      {
        error: {
          code: "PROXMOX_NOT_CONFIGURED",
          message: "Proxmox API is not configured (missing env)",
        },
      },
      { status: 503 }
    )
  }
  try {
    const resources = await getClusterResources()
    const guests = resources.map((r) => ({
      node: r.node,
      vmid: r.vmid,
      name: r.name,
      type: r.type,
      status: r.status,
      cores: r.maxcpu ?? 0,
      memory_mb: r.maxmem ? Math.round(r.maxmem / 1024 / 1024) : 0,
      memory_used_mb: r.mem ? Math.round(r.mem / 1024 / 1024) : 0,
      storage: r.storage,
      hostname: r.hostname,
    }))
    return NextResponse.json({ data: guests })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxmox API error"
    let code = "PROXMOX_ERROR"
    try {
      const parsed = JSON.parse(message) as { code?: string; message?: string }
      code = parsed.code ?? code
    } catch {
      // ignore
    }
    return NextResponse.json(
      { error: { code, message } },
      { status: 502 }
    )
  }
}
