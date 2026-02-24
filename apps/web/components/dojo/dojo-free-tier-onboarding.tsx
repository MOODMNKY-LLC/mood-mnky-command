"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sparkles, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const XP_HIGHLIGHTS = [
  "50 XP per manga read",
  "75 XP per quiz",
  "25 XP per download",
  "Up to 150 XP on orders $75+",
  "250 XP for approved UGC",
]

const DISMISS_DAYS = 7

export type DojoFreeTierOnboardingProps = {
  subscriptionTier: "free" | "member" | null
  /** ISO timestamp when user last dismissed the card; card is hidden for DISMISS_DAYS after this. */
  promptDismissedAt: string | null
}

export function DojoFreeTierOnboarding({
  subscriptionTier,
  promptDismissedAt,
}: DojoFreeTierOnboardingProps) {
  const router = useRouter()
  const isSubscribed = subscriptionTier === "free" || subscriptionTier === "member"
  if (isSubscribed) return null

  const showCard = (() => {
    if (!promptDismissedAt) return true
    const dismissed = new Date(promptDismissedAt).getTime()
    const now = Date.now()
    return now - dismissed > DISMISS_DAYS * 24 * 60 * 60 * 1000
  })()

  const handleRemindLater = async () => {
    const res = await fetch("/api/me/free-tier-prompt-dismiss", { method: "POST" })
    if (res.ok) router.refresh()
  }

  return (
    <div className="space-y-3">
      {showCard && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Unlock free XP &amp; quests</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleRemindLater}
                aria-label="Remind me later"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Join the free tier once to start earning XP on manga reads, quizzes, downloads, purchases, and UGC. One-time signup—no payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {XP_HIGHLIGHTS.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/dojo/join">Join free</Link>
              </Button>
              <Button variant="outline" onClick={handleRemindLater}>
                Remind me later
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-muted-foreground text-xs" data-testid="dojo-free-tier-perpetual-notice">
        Complete free signup to earn XP: 50 per manga read, 75 per quiz, 25 per download, up to 150 on $75+ orders, 250 for approved UGC.
      </p>
    </div>
  )
}
