import Link from "next/link"
import {
  Trophy,
  Zap,
  Gift,
  ShoppingBag,
  MessageCircle,
  BookOpen,
  Target,
  ChevronRight,
} from "lucide-react"
import { MainNav, MainFooter, MainGlassCard } from "@/components/main"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BlurFade } from "@/components/ui/blur-fade"

export const metadata = {
  title: "Loyalty – MNKY Rewards",
  description:
    "Earn XP, level up, complete quests, and unlock rewards. See how our gamification ties into the shop, community, and the Dojo.",
}

const XP_TO_LEVEL_2 = 100

export default function MainLoyaltyPage() {
  return (
    <>
      <MainNav />
      <main className="main-container py-12 md:py-16">
        <div className="mx-auto max-w-4xl space-y-16">
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              MNKY Rewards
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our loyalty system runs on XP, levels, quests, and rewards. Earn
              across the shop and community, then redeem for real benefits.
            </p>
          </div>

          <BlurFade delay={0.05} inView inViewMargin="-20px">
            <MainGlassCard className="main-glass-panel-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-foreground" />
                <h2 className="text-xl font-semibold text-foreground">
                  How it works
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                MNKY Rewards is our own system—no third-party API. Your progress
                lives in our database: an append-only XP ledger, a materialized
                level per profile, quest definitions and progress, and a rewards
                catalog. Level up by earning XP from purchases, quests, and
                community actions; then claim rewards (including future
                discount codes on the shop).
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="secondary">XP</Badge>
                <Badge variant="secondary">Levels</Badge>
                <Badge variant="secondary">Quests</Badge>
                <Badge variant="secondary">Rewards</Badge>
              </div>
            </MainGlassCard>
          </BlurFade>

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">
              In the ecosystem
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <BlurFade delay={0.08} inView inViewMargin="-20px">
                <MainGlassCard className="main-glass-panel-card flex flex-col gap-3 p-5 h-full">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-foreground" />
                    <span className="font-medium text-foreground">Shop</span>
                  </div>
                  <p className="text-sm text-muted-foreground flex-1">
                    Earn XP when you purchase. Tiered rewards (e.g. 50 XP at
                    $25, 150 at $75). Future: redeem XP for discount codes at
                    checkout.
                  </p>
                </MainGlassCard>
              </BlurFade>
              <BlurFade delay={0.12} inView inViewMargin="-20px">
                <MainGlassCard className="main-glass-panel-card flex flex-col gap-3 p-5 h-full">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-foreground" />
                    <span className="font-medium text-foreground">Community</span>
                  </div>
                  <p className="text-sm text-muted-foreground flex-1">
                    Discord events and UGC approvals feed into quests and XP.
                    Link your Discord in the Dojo to unlock community quests.
                  </p>
                </MainGlassCard>
              </BlurFade>
              <BlurFade delay={0.16} inView inViewMargin="-20px">
                <MainGlassCard className="main-glass-panel-card flex flex-col gap-3 p-5 h-full">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-foreground" />
                    <span className="font-medium text-foreground">Verse & Dojo</span>
                  </div>
                  <p className="text-sm text-muted-foreground flex-1">
                    Quests live in the Verse (e.g. read manga, pass a quiz).
                    Your Dojo shows profile and progress; balance and rewards
                    will surface there and in the Verse.
                  </p>
                </MainGlassCard>
              </BlurFade>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-foreground" />
              <h2 className="text-xl font-semibold text-foreground">Earn</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <BlurFade delay={0.06} inView inViewMargin="-20px">
                <Card className="main-glass-panel-card border border-border overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      Purchases
                      <Badge variant="outline" className="font-normal">
                        XP tiers
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Every qualifying order awards XP based on subtotal tiers
                    (configured in the back office). One award per order,
                    idempotent by order id.
                  </CardContent>
                </Card>
              </BlurFade>
              <BlurFade delay={0.1} inView inViewMargin="-20px">
                <Card className="main-glass-panel-card border border-border overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      Quests
                      <Badge variant="outline" className="font-normal">
                        +XP
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Complete objectives: read an issue, pass a manga quiz, send
                    a Discord message, get UGC approved. Each quest has an XP
                    reward; progress is tracked and completion awards once.
                  </CardContent>
                </Card>
              </BlurFade>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Gift className="h-6 w-6 text-foreground" />
              <h2 className="text-xl font-semibold text-foreground">Redeem</h2>
            </div>
            <BlurFade delay={0.05} inView inViewMargin="-20px">
              <MainGlassCard className="main-glass-panel-card p-5">
                <p className="text-sm text-muted-foreground">
                  We have a rewards catalog and claim records; redemption (e.g.
                  spend XP for a discount code) and Shopify discount creation are
                  planned. Your balance and level will power what you can unlock.
                  On the Shopify storefront, a loyalty launcher and
                  &quot;potential points&quot; block are designed to show balance
                  and earn preview—coming via our theme app extension.
                </p>
              </MainGlassCard>
            </BlurFade>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-6 w-6 text-foreground" />
              <h2 className="text-xl font-semibold text-foreground">
                Level curve
              </h2>
            </div>
            <BlurFade delay={0.05} inView inViewMargin="-20px">
              <MainGlassCard className="main-glass-panel-card p-5 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Early levels need less XP; then +500 per level. Example: Level
                  1 at 0, Level 2 at 100, Level 3 at 250, Level 4 at 500, Level 5
                  at 900, then 1400, 1900, …
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Level 1 → 2</span>
                    <span>{XP_TO_LEVEL_2} XP</span>
                  </div>
                  <Progress value={40} className="h-2" />
                </div>
              </MainGlassCard>
            </BlurFade>
          </section>

          <section className="flex flex-wrap gap-4 justify-center pt-4">
            <Button asChild className="main-btn-float">
              <Link href="/dojo/quests" className="gap-2">
                View quests
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="main-btn-glass">
              <Link href="/dojo" className="gap-2">
                Your Dojo
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </section>
        </div>
      </main>
      <MainFooter />
    </>
  )
}
