import { NextResponse } from "next/server"
import { requireInternalApiKey } from "@/lib/api/internal-auth"
import { z } from "zod"

const bodySchema = z.object({
  profileId: z.string().uuid(),
  source: z.string().min(1),
  sourceRef: z.string().optional(),
  xpDelta: z.number().int(),
  reason: z.string().optional(),
})

/**
 * Flowise can only *propose* XP awards; this endpoint logs the proposal.
 * Actual award must be done by a human or a separate approval step that calls POST /api/xp/award.
 */
export async function POST(request: Request) {
  if (!requireInternalApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  return NextResponse.json({
    ok: true,
    proposed: true,
    message: "XP award is proposed only; call POST /api/xp/award to apply.",
    profileId: parsed.data.profileId,
    xpDelta: parsed.data.xpDelta,
  })
}
