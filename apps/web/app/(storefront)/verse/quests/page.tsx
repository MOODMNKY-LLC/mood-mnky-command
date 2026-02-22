import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getVerseSubscriptionStatus } from "@/lib/verse-subscription"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VerseFreeTierBanner } from "@/components/verse/verse-free-tier-banner"

export const dynamic = "force-dynamic"

export default async function VerseQuestsPage() {
  const supabase = await createClient()
  const subscription = await getVerseSubscriptionStatus()
  const { data: quests } = await supabase
    .from("quests")
    .select("id, title, description, xp_reward, cooldown_days")
    .eq("active", true)
    .order("title")

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] space-y-8 px-4 py-8 md:px-6">
      <VerseFreeTierBanner
        subscriptionTier={subscription.subscriptionTier}
        isAuthenticated={subscription.isAuthenticated}
        context="quests and XP"
      />
      <h1 className="text-2xl font-semibold md:text-3xl">Quests</h1>
      <p className="text-muted-foreground">
        Complete quests to earn XP and unlock rewards.{" "}
        <Link href="/verse/auth/discord" className="text-primary underline">
          Connect Discord
        </Link>{" "}
        to unlock community quests.
      </p>

      {(!quests || quests.length === 0) && (
        <p className="text-muted-foreground">No active quests right now.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {quests?.map((q) => (
          <Card key={q.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{q.title}</CardTitle>
              {q.xp_reward != null && q.xp_reward > 0 && (
                <Badge variant="secondary">{q.xp_reward} XP</Badge>
              )}
            </CardHeader>
            {q.description && (
              <CardContent>
                <p className="text-muted-foreground text-sm">{q.description}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
