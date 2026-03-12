import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export type SubscriptionResponse = {
  subscription_tier: "free" | "member" | null
}

/**
 * GET /api/me/subscription
 * Returns the current user's brand subscription tier (free | member | null).
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single()

  if (error || !profile) {
    return NextResponse.json(
      { error: error?.message ?? "Profile not found" },
      { status: error?.code === "PGRST116" ? 404 : 500 }
    )
  }

  return NextResponse.json({
    subscription_tier: profile.subscription_tier ?? null,
  } satisfies SubscriptionResponse)
}
