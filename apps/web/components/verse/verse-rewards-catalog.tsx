"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, Loader2 } from "lucide-react"

export type RewardItem = {
  id: string
  type: string
  payload: Record<string, unknown>
  minLevel: number | null
}

type Props = {
  rewards: RewardItem[]
  xpTotal: number
  level: number
}

export function VerseRewardsCatalog({ rewards, xpTotal, level }: Props) {
  const [redeemingId, setRedeemingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [redeemedCode, setRedeemedCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleRedeem(rewardId: string) {
    setRedeemingId(rewardId)
    setError(null)
    setRedeemedCode(null)
    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Redemption failed")
        setDialogOpen(true)
        return
      }
      setRedeemedCode(data.code ?? null)
      setDialogOpen(true)
    } catch (e) {
      setError("Request failed")
      setDialogOpen(true)
    } finally {
      setRedeemingId(null)
    }
  }

  function copyCode() {
    if (redeemedCode) {
      void navigator.clipboard.writeText(redeemedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const costXp = (payload: Record<string, unknown>) =>
    typeof payload.cost_xp === "number" ? payload.cost_xp : 0
  const canAfford = (payload: Record<string, unknown>) =>
    xpTotal >= costXp(payload)
  const meetsLevel = (minLevel: number | null) =>
    minLevel == null || level >= minLevel

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rewards.map((r) => {
          const cost = costXp(r.payload)
          const canRedeem = canAfford(r.payload) && meetsLevel(r.minLevel)
          const isRedeeming = redeemingId === r.id
          const label =
            r.type === "discount_code"
              ? r.payload.discount_value != null
                ? r.payload.discount_type === "percentage"
                  ? `${r.payload.discount_value}% off`
                  : `$${r.payload.discount_value} off`
                : "Discount code"
              : r.type

          return (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{label}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {cost > 0 && (
                    <Badge variant="secondary">{cost} XP</Badge>
                  )}
                  {r.minLevel != null && r.minLevel > 1 && (
                    <Badge variant="outline">Level {r.minLevel}+</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  disabled={!canRedeem || isRedeeming}
                  onClick={() => handleRedeem(r.id)}
                >
                  {isRedeeming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : canRedeem ? (
                    "Redeem"
                  ) : (
                    (cost > 0 && xpTotal < cost
                      ? `Need ${cost - xpTotal} more XP`
                      : r.minLevel != null && level < r.minLevel
                        ? `Level ${r.minLevel} required`
                        : "Unavailable") as string
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {error ? "Redemption failed" : "Reward claimed"}
            </DialogTitle>
            <DialogDescription>
              {error ? (
                error
              ) : redeemedCode ? (
                <>
                  Use this code at checkout. Copy it below.
                  <div className="mt-3 flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 font-mono text-sm">
                    <span className="flex-1 break-all">{redeemedCode}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyCode}
                      aria-label="Copy code"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                "Your reward has been recorded."
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}
