import Link from "next/link"
import { DojoQuestsCard } from "@/components/dojo/dojo-quests-card"
import { ILLUSTRATIVE_MEMBER_HOME } from "@/lib/review/illustrative-member-home"

export default function ReviewQuestsPage() {
  const quests = ILLUSTRATIVE_MEMBER_HOME.quests
  return (
    <div className="mx-auto w-full max-w-lg space-y-4 p-4 md:p-8">
      <p className="text-xs text-muted-foreground">
        Illustrative quests — not live progress.{" "}
        <Link href="/review" className="underline underline-offset-2">
          Review hub
        </Link>
      </p>
      <h1 className="text-2xl font-semibold">Quests (sample)</h1>
      <DojoQuestsCard
        totalActive={quests.length}
        completedCount={quests.filter((q) => q.completed).length}
        quests={quests.map((q) => ({
          id: q.id,
          title: q.title,
          description: q.description,
          xp_reward: q.xpReward,
          status: q.completed ? "completed" : "not_started",
          actionHref: q.action?.href,
          actionLabel: q.action?.label,
        }))}
      />
    </div>
  )
}
