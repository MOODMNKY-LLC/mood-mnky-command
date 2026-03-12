"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function VerseJoinClient() {
  const router = useRouter()
  const [status, setStatus] = useState<"joining" | "done" | "error">("joining")

  useEffect(() => {
    let cancelled = false
    async function join() {
      try {
        const res = await fetch("/api/verse/subscription/join-free", {
          method: "POST",
        })
        if (cancelled) return
        if (!res.ok) {
          setStatus("error")
          return
        }
        setStatus("done")
        router.replace("/dojo")
      } catch {
        if (!cancelled) setStatus("error")
      }
    }
    join()
    return () => {
      cancelled = true
    }
  }, [router])

  if (status === "error") {
    return (
      <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-16 text-center">
        <p className="text-muted-foreground">Something went wrong. Please try again.</p>
        <a href="/dojo" className="text-primary mt-4 inline-block underline">
          Go to MNKY DOJO
        </a>
      </div>
    )
  }

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-16 text-center">
      <p className="text-muted-foreground">Setting up your free access...</p>
      <p className="text-muted-foreground text-sm mt-2">Redirecting to MNKY DOJO.</p>
    </div>
  )
}
