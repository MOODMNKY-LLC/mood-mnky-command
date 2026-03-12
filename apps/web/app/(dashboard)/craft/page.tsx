"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { BlurFade } from "@/components/ui/blur-fade"
import { DotPattern } from "@/components/ui/dot-pattern"
import { Bot } from "lucide-react"

export default function CraftPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setLoading(false)
      setUserId(user?.id ?? null)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
        <p className="text-center text-muted-foreground">
          Sign in to use the fragrance crafting assistant.
        </p>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] flex-col">
      <BlurFade
        delay={0.1}
        inView
        className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 p-8"
      >
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="rounded-full bg-muted p-4">
            <Bot className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Fragrance Crafting — Coming Soon
          </h1>
          <p className="text-sm text-muted-foreground">
            Our guided fragrance blending experience is being upgraded. In the
            meantime, use the AI Chat to search oils, calculate proportions, and
            save custom blends.
          </p>
          <Link
            href="/chat"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Open AI Chat
          </Link>
        </div>
      </BlurFade>
      <DotPattern
        className="pointer-events-none absolute inset-0 opacity-30"
        cr={1}
        cx={1}
        cy={1}
      />
    </div>
  )
}
