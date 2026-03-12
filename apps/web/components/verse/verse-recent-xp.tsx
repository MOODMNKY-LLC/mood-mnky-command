"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type XpEntry = {
  source: string
  sourceRef: string | null
  xpDelta: number
  reason: string | null
  createdAt: string
}

const SOURCE_LABELS: Record<string, string> = {
  purchase: "Purchase",
  quest: "Quest",
  mag_read: "Manga read",
  mag_quiz: "Quiz passed",
  mag_download: "Download",
  ugc_approved: "UGC approved",
  redemption: "Redeemed reward",
}

function labelFor(source: string): string {
  return SOURCE_LABELS[source] ?? source.replace(/_/g, " ")
}

export function VerseRecentXp() {
  const [entries, setEntries] = useState<XpEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/xp/recent?limit=5", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((data) => setEntries(data.entries ?? []))
      .finally(() => setLoading(false))
  }, [])

  const earned = entries.filter((e) => e.xpDelta > 0)
  if (loading || earned.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {earned.slice(0, 5).map((e, i) => (
            <li key={`${e.createdAt}-${i}`}>
              <span className="font-medium text-foreground">+{e.xpDelta} XP</span>
              {" · "}
              {labelFor(e.source)}
              {e.reason && (
                <span className="ml-1 truncate opacity-80">({e.reason})</span>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
