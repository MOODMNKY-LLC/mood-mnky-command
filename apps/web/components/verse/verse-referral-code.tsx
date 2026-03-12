"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, Users } from "lucide-react"

export function VerseReferralCode() {
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/referral/my-code")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.code) setCode(data.code)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function copyCode() {
    if (code) {
      void navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading || !code) return null

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          Your referral code
        </p>
        <div className="mt-2 flex items-center gap-2">
          <code className="rounded bg-muted px-2 py-1 font-mono text-sm">{code}</code>
          <Button
            variant="outline"
            size="icon"
            onClick={copyCode}
            aria-label="Copy referral code"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Share this code with friends. When they sign up or place their first order, you may earn rewards.
        </p>
      </CardContent>
    </Card>
  )
}
