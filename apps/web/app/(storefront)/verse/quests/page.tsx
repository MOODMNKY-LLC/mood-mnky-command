import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getVerseSubscriptionStatus } from "@/lib/verse-subscription"
import { getQuestProgressForProfile } from "@/lib/gamification/quest-progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VerseFreeTierBanner } from "@/components/verse/verse-free-tier-banner"
import { CheckCircle2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function VerseQuestsPage() {
  const supabase = await createClient()
  const subscription = await getVerseSubscriptionStatus()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: quests } = await supabase
    .from("quests")
    .select("id, title, description, xp_reward, cooldown_days, rule")
    .eq("active", true)
    .order("title")

  let completedQuestIds: Set<string> = new Set()
  let completedCount = 0
  let progressMap: Record<string, { metCount: number; total: number }> = {}
  if (user && quests && quests.length > 0) {
    const admin = createAdminClient()
    const progressList = await getQuestProgressForProfile(
      admin,
      user.id,
      quests.map((q) => ({ id: q.id, rule: q.rule }))
    )
    progressList.forEach((p) => {
      progressMap[p.questId] = {
        metCount: p.metCount,
        total: p.totalRequirements,
      }
      if (p.completed) {
        completedQuestIds.add(p.questId)
        completedCount++
      }
    })
  }

  const totalQuests = quests?.length ?? 0

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

      {user && totalQuests > 0 && (
        <p className="text-sm font-medium text-muted-foreground">
          {completedCount} of {totalQuests} completed
        </p>
      )}

      {(!quests || quests.length === 0) && (
        <p className="text-muted-foreground">No active quests right now.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {quests?.map((q) => {
          const completed = completedQuestIds.has(q.id)
          const progress = progressMap[q.id]
          const showPath = progress && progress.total > 0 && !completed
          return (
            <Card key={q.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">{q.title}</CardTitle>
                  {completed && (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Done
                    </Badge>
                  )}
                  {showPath && (
                    <Badge variant="outline" className="font-normal">
                      {progress.metCount} of {progress.total}
                    </Badge>
                  )}
                  {q.xp_reward != null && q.xp_reward > 0 && (
                    <Badge variant="secondary">{q.xp_reward} XP</Badge>
                  )}
                </div>
              </CardHeader>
              {q.description && (
                <CardContent>
                  <p className="text-muted-foreground text-sm">{q.description}</p>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
