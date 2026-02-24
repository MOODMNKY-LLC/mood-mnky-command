import { createAdminClient } from "@/lib/supabase/admin"

export type LeaderboardEntry = {
  rank: number
  profileId: string
  displayName: string
  xpTotal: number
  level: number
}

/**
 * Server-only: fetch leaderboard using admin client (bypasses RLS).
 */
export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const supabase = createAdminClient()
  const capped = Math.min(100, Math.max(1, limit))

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
    .limit(capped)

  if (error) return []

  return (rows ?? []).map((r, i) => ({
    rank: i + 1,
    profileId: (r as { profile_id: string }).profile_id,
    displayName:
      (r as { profiles: { display_name: string | null } | null })?.profiles
        ?.display_name ?? "Anonymous",
    xpTotal: (r as { xp_total: number }).xp_total,
    level: (r as { level: number }).level,
  }))
}
