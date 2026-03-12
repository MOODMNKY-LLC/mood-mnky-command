import { NextResponse } from "next/server"
import { requireInternalApiKey } from "@/lib/api/internal-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { isProfileEligibleForXp } from "@/lib/xp-eligibility"
import { z } from "zod"

const awardSchema = z.object({
  profileId: z.string().uuid(),
  source: z.string().min(1),
  sourceRef: z.string().optional(),
  xpDelta: z.number().int(),
  reason: z.string().optional(),
})

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

  const parsed = awardSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { profileId, source, sourceRef, xpDelta, reason } = parsed.data

  const eligible = await isProfileEligibleForXp(profileId)
  if (!eligible) {
    return NextResponse.json(
      { ok: true, awarded: 0, reason: "subscription_required" },
      { status: 200 }
    )
  }

  const supabase = createAdminClient()
  const { error } = await supabase.rpc("award_xp", {
    p_profile_id: profileId,
    p_source: source,
    p_source_ref: sourceRef ?? null,
    p_xp_delta: xpDelta,
    p_reason: reason ?? null,
  })

  if (error) {
    return NextResponse.json(
      { error: "Failed to award XP", details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
