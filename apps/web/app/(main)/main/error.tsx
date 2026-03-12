"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Main section error:", error)
  }, [error])

  return (
    <div className="main-container flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
      <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        We couldn’t load this page. Please try again.
      </p>
      <div className="mt-6 flex gap-4">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/main">Back to home</Link>
        </Button>
      </div>
    </div>
  )
}
