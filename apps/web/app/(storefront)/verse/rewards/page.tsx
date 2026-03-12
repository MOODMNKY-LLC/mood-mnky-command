import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { VerseRewardsCatalog } from "@/components/verse/verse-rewards-catalog"
import { VerseReferralCode } from "@/components/verse/verse-referral-code"
import { VerseMyClaims } from "@/components/verse/verse-my-claims"
import { VerseRecentXp } from "@/components/verse/verse-recent-xp"
import { getVerseSubscriptionStatus } from "@/lib/verse-subscription"
import { VerseFreeTierBanner } from "@/components/verse/verse-free-tier-banner"
import { getTierName, parseVipTiersFromConfig } from "@/lib/gamification/vip-tiers"

export const dynamic = "force-dynamic"

export default async function VerseRewardsPage() {
  const supabase = await createClient()
  const subscription = await getVerseSubscriptionStatus()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: rewards }, { data: vipConfig }, { data: xpState }] = await Promise.all([
    supabase
      .from("rewards")
      .select("id, type, payload, min_level")
      .eq("active", true)
      .order("min_level", { ascending: true, nullsFirst: true }),
    supabase
      .from("config_xp_rules")
      .select("value")
      .eq("key", "vip_tiers")
      .maybeSingle(),
    user
      ? supabase
          .from("xp_state")
          .select("xp_total, level")
          .eq("profile_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const xpTotal = xpState?.xp_total ?? 0
  const level = xpState?.level ?? 1
  const tiers = parseVipTiersFromConfig(vipConfig?.value ?? null)
  const tierName = getTierName(level, tiers)
  const rewardList = (rewards ?? []).map((r) => ({
    id: r.id,
    type: r.type,
    payload: (r.payload ?? {}) as Record<string, unknown>,
    minLevel: r.min_level,
  }))

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] space-y-8 px-4 py-8 md:px-6">
      <VerseFreeTierBanner
        subscriptionTier={subscription.subscriptionTier}
        isAuthenticated={subscription.isAuthenticated}
        context="rewards and XP"
      />
      <h1 className="text-2xl font-semibold md:text-3xl">MNKY Rewards</h1>
      <p className="text-muted-foreground">
        XP and level unlock rewards; quests and purchases grow both. Spend XP on
        discount codes and perks.{" "}
        <Link href="/verse/quests" className="text-primary underline">
          Earn more XP
        </Link>{" "}
        with quests and purchases.
      </p>

      {user ? (
        <>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Your balance</p>
              <p className="text-2xl font-semibold">
                {xpTotal} XP <span className="text-muted-foreground">·</span>{" "}
                {tierName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                <Link href="/verse/leaderboard" className="underline hover:text-foreground">
                  View leaderboard
                </Link>
              </p>
            </CardContent>
          </Card>

          <VerseReferralCode />

          <div className="grid gap-4 sm:grid-cols-2">
            <VerseRecentXp />
            <VerseMyClaims />
          </div>

          {rewardList.length === 0 ? (
            <p className="text-muted-foreground">
              No rewards available right now. Check back later.
            </p>
          ) : (
            <VerseRewardsCatalog
              rewards={rewardList}
              xpTotal={xpTotal}
              level={level}
            />
          )}
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              <Link href="/auth/login" className="text-primary underline">
                Log in
              </Link>{" "}
              to view your balance and redeem rewards.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
