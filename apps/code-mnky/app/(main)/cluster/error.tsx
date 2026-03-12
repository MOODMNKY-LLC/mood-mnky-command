"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ClusterError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Cluster error:", error)
  }, [error])

  return (
    <div className="main-container w-full flex-1 py-12">
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="text-lg font-semibold text-destructive">Something went wrong</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-4 flex gap-3">
          <Button variant="outline" size="sm" onClick={reset}>
            Try again
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Back to CODE MNKY</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
