import { NextResponse } from "next/server"
import { isProxmoxConfigured, getClusterStatus } from "@/lib/proxmox/client"

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
    const status = await getClusterStatus()
    const nodeList = status.node_list ?? []
    return NextResponse.json({
      data: {
        cluster_name: "MOODMNKY",
        quorum: status.quorum?.quorum ?? 0,
        quorum_ok: (status.quorum?.quorum ?? 0) > 0,
        node_count: nodeList.length,
        nodes: nodeList,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Proxmox API error"
    let code = "PROXMOX_ERROR"
    try {
      const parsed = JSON.parse(message) as { code?: string; message?: string }
      code = parsed.code ?? code
    } catch {
      // use default code
    }
    return NextResponse.json(
      { error: { code, message } },
      { status: 502 }
    )
  }
}
