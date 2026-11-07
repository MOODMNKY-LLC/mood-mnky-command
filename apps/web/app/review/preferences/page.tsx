import Link from "next/link"
import { ILLUSTRATIVE_MEMBER_HOME } from "@/lib/review/illustrative-member-home"

export default function ReviewPreferencesPage() {
  const data = ILLUSTRATIVE_MEMBER_HOME
  return (
    <div className="mx-auto w-full max-w-lg space-y-4 p-4 md:p-8">
      <p className="text-xs text-muted-foreground">
        Illustrative preferences — writes disabled.{" "}
        <Link href="/review" className="underline underline-offset-2">
          Review hub
        </Link>
      </p>
      <h1 className="text-2xl font-semibold">Preferences (sample)</h1>
      <dl className="space-y-3 rounded-xl border border-border/60 bg-card/40 p-4 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Scent personality
          </dt>
          <dd className="font-medium">{data.scentPersonality}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Favorite notes
          </dt>
          <dd className="font-medium">{data.favoriteNotes}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Wishlist (sample count)
          </dt>
          <dd className="font-medium">{data.wishlistCount}</dd>
        </div>
      </dl>
    </div>
  )
}
