import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/gamification/leaderboard?limit=50
 * Returns top profiles by xp_total (read-only). Uses admin client to bypass RLS.
 * Optional: seasonId for future season-scoped leaderboard.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50))

  const supabase = createAdminClient()

  const { data: rows, error } = await supabase
    .from("xp_state")
    .select(
      `
      profile_id,
      xp_total,
      level,
      profiles!inner(display_name)
    `
    )
    .order("xp_total", { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch leaderboard", details: error.message },
      { status: 500 }
    )
  }

  const list = (rows ?? []).map((r, i) => ({
    rank: i + 1,
    profileId: (r as { profile_id: string }).profile_id,
    displayName:
      (r as { profiles: { display_name: string | null } | null })?.profiles
        ?.display_name ?? "Anonymous",
    xpTotal: (r as { xp_total: number }).xp_total,
    level: (r as { level: number }).level,
  }))

  return NextResponse.json({ leaderboard: list })
}
