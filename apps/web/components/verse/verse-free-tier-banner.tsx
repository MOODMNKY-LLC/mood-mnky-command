import Link from "next/link"
import { Sparkles } from "lucide-react"

export type VerseFreeTierBannerProps = {
  /** When false or null, show "Join free" CTA. When 'free' or 'member', hide banner. */
  subscriptionTier: "free" | "member" | null
  isAuthenticated: boolean
  /** Optional: e.g. "manga" or "this drop" for context. */
  context?: string
}

/**
 * Shown on manga and editorial pages when user is not signed in or has not claimed free tier.
 * Hooks manga/editorials to the free-tier subscription flow (CTA → /verse/join).
 */
export function VerseFreeTierBanner({
  subscriptionTier,
  isAuthenticated,
  context = "drops and manga",
}: VerseFreeTierBannerProps) {
  const showBanner = !isAuthenticated || subscriptionTier === null
  if (!showBanner) return null

  const copy = isAuthenticated
    ? "Claim your free access to unlock XP, quests, and members-only perks."
    : `Join free to access ${context}, earn XP, and unlock quests.`

  return (
    <div className="rounded-lg border border-verse-text/15 bg-verse-text/5 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-5 w-5 shrink-0 text-verse-text-muted" />
        <p className="text-sm text-verse-text">
          {copy}{" "}
          <Link
            href="/verse/join"
            className="font-medium underline underline-offset-2 hover:text-verse-text-muted"
          >
            {isAuthenticated ? "Claim free access" : "Join free"}
          </Link>
        </p>
      </div>
    </div>
  )
}
