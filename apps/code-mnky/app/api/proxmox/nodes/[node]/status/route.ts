import { NextResponse } from "next/server"
import { isProxmoxConfigured, getNodeStatus } from "@/lib/proxmox/client"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ node: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { node } = await params
  if (!node) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "node is required" } },
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
    const status = await getNodeStatus(node)
    return NextResponse.json({ data: status })
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
