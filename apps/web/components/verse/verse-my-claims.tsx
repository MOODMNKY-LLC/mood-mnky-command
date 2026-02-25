"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, Ticket } from "lucide-react"

type Claim = {
  id: string
  status: string
  issuedAt: string
  externalRef: string | null
  reward: {
    id: string
    type: string
    payload: Record<string, unknown>
    minLevel: number | null
  } | null
}

export function VerseMyClaims() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/rewards/my-claims", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { claims: [] }))
      .then((data) => {
        setClaims(data.claims ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  function copyCode(claimId: string, code: string) {
    void navigator.clipboard.writeText(code)
    setCopiedId(claimId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) return null
  if (claims.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Ticket className="h-4 w-4" />
          My claimed rewards
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {claims.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">
                {c.reward?.type === "discount_code"
                  ? (c.reward.payload?.discount_value != null
                      ? c.reward.payload.discount_type === "percentage"
                        ? `${c.reward.payload.discount_value}% off`
                        : `$${c.reward.payload.discount_value} off`
                      : "Discount") + " · "
                  : ""}
                {new Date(c.issuedAt).toLocaleDateString()}
              </span>
              {c.externalRef && (
                <div className="flex items-center gap-2">
                  <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                    {c.externalRef}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyCode(c.id, c.externalRef!)}
                    aria-label="Copy code"
                  >
                    {copiedId === c.id ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
