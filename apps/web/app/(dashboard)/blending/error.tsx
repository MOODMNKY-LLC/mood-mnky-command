"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function BlendingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Blending Lab error]", error)
  }, [error])

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card className="border-destructive/50 max-w-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            The Blending Lab couldn&apos;t load. This can happen if the fragrance catalog
            is unavailable or data is in an unexpected format. Try again or return to the
            dashboard.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={reset}>
              Try again
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Back to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
