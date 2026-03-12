import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/referral/my-code
 * Returns the current user's referral code (creates one if none). Authenticated only.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: existing } = await supabase
    .from("referral_codes")
    .select("code")
    .eq("profile_id", user.id)
    .limit(1)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ code: existing.code })
  }

  const code = generateCode()
  const { data: inserted, error } = await supabase
    .from("referral_codes")
    .insert({ profile_id: user.id, code })
    .select("code")
    .single()

  if (error) {
    if (error.code === "23505") {
      const { data: retry } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("profile_id", user.id)
        .maybeSingle()
      if (retry) return NextResponse.json({ code: retry.code })
    }
    return NextResponse.json(
      { error: "Failed to create code", details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ code: inserted?.code ?? code })
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let s = "MNKY-"
  for (let i = 0; i < 6; i++) {
    s += chars[Math.floor(Math.random() * chars.length)]
  }
  return s
}
