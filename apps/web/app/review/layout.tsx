import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Illustrative review · MOOD MNKY",
  description:
    "Read-only illustrative preview surfaces. Not live accounts or entitlements.",
  robots: { index: false, follow: false },
}

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div
        role="status"
        className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-950 dark:text-amber-100"
      >
        Illustrative review mode · sample data only · no real session · writes
        disabled ·{" "}
        <Link href="/main?review=1" className="underline underline-offset-2">
          Back to Main
        </Link>
      </div>
      {children}
    </div>
  )
}
