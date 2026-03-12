import { NextResponse } from "next/server"
import {
  isProxmoxConfigured,
  getClusterResources,
  getGuestStatus,
} from "@/lib/proxmox/client"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ node: string; vmid: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { node, vmid } = await params
  if (!node || !vmid) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "node and vmid are required",
        },
      },
      { status: 400 }
    )
  }
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
    const guest = resources.find(
      (r) => r.node === node && String(r.vmid) === vmid
    )
    if (!guest) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: `Guest ${node}/${vmid} not found`,
          },
        },
        { status: 404 }
      )
    }
    const status = await getGuestStatus(node, vmid, guest.type)
    return NextResponse.json({
      data: {
        node: guest.node,
        vmid: guest.vmid,
        name: guest.name,
        type: guest.type,
        status: status.status,
        config: {
          cores: guest.maxcpu,
          memory_mb: guest.maxmem
            ? Math.round(guest.maxmem / 1024 / 1024)
            : 0,
          storage: guest.storage,
        },
        current: status,
      },
    })
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
