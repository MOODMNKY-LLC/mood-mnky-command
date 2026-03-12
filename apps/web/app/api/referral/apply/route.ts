import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/referral/apply
 * Records a referral event (signed_up, first_order). Idempotent by source_ref.
 * Auth: MOODMNKY_API_KEY (server/serverless only).
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization")
  const apiKey = process.env.MOODMNKY_API_KEY
  if (!apiKey || auth !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { code: string; refereeId: string; eventType: "signed_up" | "first_order" }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { code, refereeId, eventType } = body
  if (!code || !refereeId || !eventType) {
    return NextResponse.json(
      { error: "code, refereeId, eventType required" },
      { status: 400 }
    )
  }
  if (eventType !== "signed_up" && eventType !== "first_order") {
    return NextResponse.json({ error: "eventType must be signed_up or first_order" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: refCode } = await supabase
    .from("referral_codes")
    .select("profile_id")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle()

  if (!refCode) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 404 })
  }

  const sourceRef = `${refereeId}:${eventType}`

  const { data: existing } = await supabase
    .from("referral_events")
    .select("id")
    .eq("source_ref", sourceRef)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ applied: true, duplicate: true })
  }

  const { error: insertErr } = await supabase.from("referral_events").insert({
    referrer_id: refCode.profile_id,
    referee_id: refereeId,
    code_used: code.trim().toUpperCase(),
    event_type: eventType,
    source_ref: sourceRef,
  })

  if (insertErr) {
    return NextResponse.json(
      { error: "Failed to record event", details: insertErr.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ applied: true })
}
