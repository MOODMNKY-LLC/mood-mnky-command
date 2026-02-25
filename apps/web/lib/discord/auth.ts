/**
 * Require MNKY LABZ admin for Discord control panel API routes.
 */

import { NextRequest, NextResponse } from "next/server"
import { authenticateFunnelAdmin } from "@/lib/auth/funnel-admin"

export type DiscordAuthResult =
  | { ok: true }
  | { ok: false; response: NextResponse }

export async function requireDiscordAdmin(request: NextRequest): Promise<DiscordAuthResult> {
  const auth = await authenticateFunnelAdmin(request)
  if (!auth.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: auth.error }, { status: auth.status }),
    }
  }
  return { ok: true }
}
