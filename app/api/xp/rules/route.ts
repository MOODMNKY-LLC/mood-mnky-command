import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/** Public-safe XP rules for storefront banners. Uses service role to bypass RLS (anon can see purchase tiers). */
const PUBLIC_KEYS = ["purchase"] as const

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const keysParam = searchParams.get("keys")
  const keys = keysParam
    ? (keysParam.split(",").map((k) => k.trim()).filter(Boolean) as string[])
    : [...PUBLIC_KEYS]

  const allowed = keys.filter((k) => PUBLIC_KEYS.includes(k as (typeof PUBLIC_KEYS)[number]))
  if (allowed.length === 0) {
    return NextResponse.json({ rules: {} })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("config_xp_rules")
    .select("key, value")
    .in("key", allowed)

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch XP rules", details: error.message },
      { status: 500 }
    )
  }

  const rules = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
  return NextResponse.json({ rules })
}
