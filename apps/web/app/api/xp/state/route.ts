import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getTierName, parseVipTiersFromConfig } from "@/lib/gamification/vip-tiers"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [xpResult, vipResult] = await Promise.all([
    supabase
      .from("xp_state")
      .select("xp_total, level, updated_at")
      .eq("profile_id", user.id)
      .single(),
    supabase
      .from("config_xp_rules")
      .select("value")
      .eq("key", "vip_tiers")
      .maybeSingle(),
  ])

  const { data, error } = xpResult
  if (error && error.code !== "PGRST116") {
    return NextResponse.json(
      { error: "Failed to fetch XP state", details: error.message },
      { status: 500 }
    )
  }

  const level = data?.level ?? 1
  const tiers = parseVipTiersFromConfig(vipResult.data?.value ?? null)
  const tierName = getTierName(level, tiers)

  return NextResponse.json({
    xpTotal: data?.xp_total ?? 0,
    level,
    tierName,
    updatedAt: data?.updated_at ?? null,
  })
}
