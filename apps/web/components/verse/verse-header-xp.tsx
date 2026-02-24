"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export function VerseHeaderXp() {
  const [state, setState] = useState<{ xpTotal: number; level: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/xp/state", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setState({ xpTotal: data.xpTotal ?? 0, level: data.level ?? 1 })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!state) return null

  return (
    <Link
      href="/dojo/rewards"
      className="flex min-h-[44px] items-center gap-1.5 rounded-md px-2 text-sm font-medium text-verse-text-muted transition-colors hover:bg-verse-bg-hover hover:text-verse-text"
      title="Your XP and rewards"
    >
      <span>{state.xpTotal} XP</span>
      <span className="text-verse-text-muted/80">·</span>
      <span>L{state.level}</span>
    </Link>
  )
}
