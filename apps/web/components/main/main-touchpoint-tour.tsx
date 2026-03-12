"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useMainTouchpointTour } from "./main-touchpoint-tour-context"
import { ROUTES } from "@/lib/nav-routes"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "main-touchpoint-tour-seen"
const FIRST_VISIT_DELAY_MS = 1000

const STEPS = [
  {
    title: "Welcome",
    description:
      "This is MOOD MNKY — your home for bespoke fragrance and the Dojo.",
    actionLabel: null,
    actionHref: null,
  },
  {
    title: "Enter the Dojo",
    description:
      "Enter the Dojo to shop, blend, and explore. Use the Dojo link in the nav or the button below.",
    actionLabel: "Open Dojo",
    actionHref: ROUTES.STOREFRONT,
  },
  {
    title: "Create an account",
    description:
      "Create an account to save your blends and shop. Sign up is in the top right and in the hero.",
    actionLabel: "Sign up",
    actionHref: ROUTES.AUTH_SIGN_UP,
  },
  {
    title: "Discover",
    description:
      "Use Explore and About in the nav for fragrances, formulas, and our story.",
    actionLabel: null,
    actionHref: null,
  },
  {
    title: "You're set",
    description:
      "You can revisit this anytime via \"Take a tour\" in the footer or nav.",
    actionLabel: null,
    actionHref: null,
  },
] as const

export function MainTouchpointTour() {
  const pathname = usePathname()
  const { tourOpen, setTourOpen } = useMainTouchpointTour()
  const [step, setStep] = React.useState(0)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted || !pathname?.startsWith("/main")) return
    try {
      if (localStorage.getItem(STORAGE_KEY)) return
      const t = setTimeout(() => setTourOpen(true), FIRST_VISIT_DELAY_MS)
      return () => clearTimeout(t)
    } catch {
      // ignore
    }
  }, [mounted, pathname, setTourOpen])

  const markSeen = React.useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "true")
    } catch {
      // ignore
    }
  }, [])

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        markSeen()
        setStep(0)
      }
      setTourOpen(open)
    },
    [markSeen, setTourOpen]
  )

  const handleSkip = () => {
    markSeen()
    setStep(0)
    setTourOpen(false)
  }

  const handleBack = () => {
    setStep((s) => Math.max(0, s - 1))
  }

  const handleNext = () => {
    if (step >= STEPS.length - 1) {
      markSeen()
      setStep(0)
      setTourOpen(false)
      return
    }
    setStep((s) => s + 1)
  }

  const current = STEPS[step]
  const isFirst = step === 0
  const isLast = step === STEPS.length - 1

  return (
    <Dialog open={tourOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "main-glass-panel-card border-border/50 max-w-md",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
        aria-describedby="main-tour-description"
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {current.title}
          </DialogTitle>
          <DialogDescription id="main-tour-description" className="text-sm">
            {current.description}
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          {current.actionLabel && current.actionHref && (
            <Button asChild size="sm" variant="secondary" className="mt-1">
              <Link
                href={current.actionHref}
                onClick={() => handleOpenChange(false)}
              >
                {current.actionLabel}
              </Link>
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 pt-2">
          <span className="text-xs text-muted-foreground" aria-live="polite">
            Step {step + 1} of {STEPS.length}
          </span>
          <DialogFooter className="flex flex-row gap-2 p-0 sm:p-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Skip tour
            </Button>
            {!isFirst && (
              <Button type="button" variant="outline" size="sm" onClick={handleBack}>
                Back
              </Button>
            )}
            <Button type="button" size="sm" onClick={handleNext}>
              {isLast ? "Finish" : "Next"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
