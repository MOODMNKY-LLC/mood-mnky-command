import Link from "next/link"
import { DojoWelcomeHero } from "@/components/dojo/dojo-welcome-hero"
import { DojoCharacterCard } from "@/components/dojo/dojo-character-card"
import { DojoXpCard } from "@/components/dojo/dojo-xp-card"
import { DojoQuestsCard } from "@/components/dojo/dojo-quests-card"
import { DojoQuickActionsCard } from "@/components/dojo/dojo-quick-actions-card"
import { DojoHomeSections } from "@/components/dojo/dojo-home-sections"
import { DojoPrivateServicesPreview } from "@/components/dojo/dojo-private-services-preview"
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern"
import { ILLUSTRATIVE_MEMBER_HOME } from "@/lib/review/illustrative-member-home"

/**
 * Server-rendered illustrative member home for hosted preview without real auth.
 * Does not call Supabase, does not set cookies, does not grant rights.
 * Query flags on other routes never unlock this privilege model — this path is
 * explicitly sample-only.
 */
export default function IllustrativeMemberHomePage() {
  const data = ILLUSTRATIVE_MEMBER_HOME
  const completedCount = data.quests.filter((q) => q.completed).length

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-6">
      <p className="rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        {data.banner}{" "}
        <Link href="/auth/login?review=1" className="underline underline-offset-2">
          Account entry
        </Link>
      </p>

      <DojoWelcomeHero displayName={data.displayName} isReturning />

      <DojoPrivateServicesPreview />

      <div className="grid auto-rows-min gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DojoCharacterCard
          displayName={data.displayName}
          avatarUrl={null}
          email={data.email}
          xpTotal={data.xpTotal}
          level={data.level}
          handle="preview-member"
          shopifyLinked={data.shopifyLinked}
        />
        <DojoXpCard xpTotal={data.xpTotal} level={data.level} />
        <DojoQuestsCard
          totalActive={data.quests.length}
          completedCount={completedCount}
          quests={data.quests.map((q) => ({
            id: q.id,
            title: q.title,
            description: q.description,
            xp_reward: q.xpReward,
            status: q.completed ? "completed" : "not_started",
            actionHref: q.action?.href,
            actionLabel: q.action?.label,
          }))}
        />
        <DojoQuickActionsCard />
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-muted/50 p-4">
        <div className="absolute inset-0 overflow-hidden rounded-xl" aria-hidden>
          <AnimatedGridPattern
            numSquares={40}
            maxOpacity={0.12}
            duration={4}
            repeatDelay={0.5}
            width={40}
            height={40}
            className="fill-muted-foreground/15 stroke-muted-foreground/15"
          />
        </div>
        <div className="relative z-10 space-y-4">
          <h2 className="text-lg font-semibold">Your space (sample)</h2>
          <DojoHomeSections
            rewardClaims={[]}
            savedBlendsCount={data.savedBlendsCount}
            funnelProfile={null}
            linkedAccounts={data.linkedAccounts}
            featuredIssue={null}
            shopifyLinked={data.shopifyLinked}
            wishlistCount={data.wishlistCount}
            scentPersonality={data.scentPersonality}
            lastSyncAt={null}
            favoriteNotes={data.favoriteNotes}
            sizePreferences={{}}
          />
        </div>
      </div>
    </div>
  )
}
