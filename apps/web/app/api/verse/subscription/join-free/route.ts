import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/verse/subscription/join-free
 * Claims free-tier subscription for the authenticated user.
 * Idempotent: if already free or member, returns ok. Used when existing users
 * (no subscription_tier) click "Unlock Members Access" or land on /verse/join.
 */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, subscription_tier, stripe_customer_id")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  if (profile.subscription_tier === "free" || profile.subscription_tier === "member") {
    return NextResponse.json({
      ok: true,
      subscription_tier: profile.subscription_tier,
      message: "Already subscribed",
    })
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      subscription_tier: "free",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) {
    return NextResponse.json(
      { error: "Failed to join free tier", details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    subscription_tier: "free",
    message: "Free tier activated",
  })
}
