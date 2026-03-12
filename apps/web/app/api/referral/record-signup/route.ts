import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/referral/record-signup
 * Records a referral event for signed_up (referee = current user). Call after sign-up when user
 * signed up with a referral code. Session auth.
 * Body: { code: string }
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { code?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : ""
  if (!code) {
    return NextResponse.json(
      { error: "code required" },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  const { data: refCode } = await admin
    .from("referral_codes")
    .select("profile_id")
    .eq("code", code)
    .maybeSingle()

  if (!refCode) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 404 })
  }

  if (refCode.profile_id === user.id) {
    return NextResponse.json(
      { error: "Cannot use your own referral code" },
      { status: 400 }
    )
  }

  const sourceRef = `${user.id}:signed_up`

  const { data: existing } = await admin
    .from("referral_events")
    .select("id")
    .eq("source_ref", sourceRef)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ applied: true, duplicate: true })
  }

  const { error: insertErr } = await admin.from("referral_events").insert({
    referrer_id: refCode.profile_id,
    referee_id: user.id,
    code_used: code,
    event_type: "signed_up",
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
