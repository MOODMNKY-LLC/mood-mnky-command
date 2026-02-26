"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMainUser } from "@/components/main/main-user-context"

const STORAGE_KEY = "main-onboarding-dismissed"

export function MainOnboardingBanner() {
  const user = useMainUser()
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || user) {
      setVisible(false)
      return
    }
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY)
      setVisible(!dismissed)
    } catch {
      setVisible(true)
    }
  }, [mounted, user])

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true")
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="main-container flex flex-wrap items-center justify-center gap-3 border-b border-border bg-muted/30 px-4 py-2.5 text-center text-sm text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <span>
        New here? Sign up to shop and use the Blending Lab.
      </span>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="default" className="h-8">
          <Link href="/auth/sign-up">Sign up</Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label="Dismiss"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
