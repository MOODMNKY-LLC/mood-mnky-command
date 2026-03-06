import { NextResponse } from "next/server"
import { isProxmoxConfigured, getNodes } from "@/lib/proxmox/client"

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
    const nodes = await getNodes()
    return NextResponse.json({ data: nodes })
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
