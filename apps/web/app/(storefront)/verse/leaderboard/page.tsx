import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getTierName, parseVipTiersFromConfig } from "@/lib/gamification/vip-tiers"
import { getLeaderboard } from "@/lib/gamification/leaderboard"
import { Trophy, Medal } from "lucide-react"

export const dynamic = "force-dynamic"

const LEADERBOARD_LIMIT = 50

export default async function VerseLeaderboardPage() {
  const supabase = await createClient()

  const [rawList, { data: vipConfig }] = await Promise.all([
    getLeaderboard(LEADERBOARD_LIMIT),
    supabase
      .from("config_xp_rules")
      .select("value")
      .eq("key", "vip_tiers")
      .maybeSingle(),
  ])

  const tiers = parseVipTiersFromConfig(vipConfig?.value ?? null)
  const list = rawList.map((e) => ({
    ...e,
    tierName: getTierName(e.level, tiers),
  }))

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] space-y-8 px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-semibold md:text-3xl flex items-center gap-2">
          <Trophy className="h-8 w-8 text-amber-500" />
          Leaderboard
        </h1>
        <Link
          href="/verse/rewards"
          className="text-sm text-muted-foreground underline hover:text-foreground"
        >
          Back to Rewards
        </Link>
      </div>
      <p className="text-muted-foreground">
        Top members by total XP. Earn more with{" "}
        <Link href="/verse/quests" className="text-primary underline">
          quests
        </Link>{" "}
        and purchases.
      </p>

      {list.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No entries yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Top {list.length}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {list.map((entry) => (
                <li
                  key={entry.profileId}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6"
                >
                  <span className="flex w-8 items-center justify-center text-sm font-medium text-muted-foreground">
                    {entry.rank === 1 ? (
                      <Medal className="h-5 w-5 text-amber-500" aria-label="1st" />
                    ) : entry.rank === 2 ? (
                      <Medal className="h-5 w-5 text-slate-400" aria-label="2nd" />
                    ) : entry.rank === 3 ? (
                      <Medal className="h-5 w-5 text-amber-700" aria-label="3rd" />
                    ) : (
                      entry.rank
                    )}
                  </span>
                  <span className="min-w-0 flex-1 font-medium truncate">
                    {entry.displayName || "Anonymous"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{entry.xpTotal} XP</Badge>
                    <Badge variant="outline" className="font-normal">
                      {entry.tierName}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
