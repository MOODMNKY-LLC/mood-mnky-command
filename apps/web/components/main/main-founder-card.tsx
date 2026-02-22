"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MainGlassCard } from "@/components/main/main-glass-card"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"

const FOUNDER_NAME = "Simeon Bowman"
const FOUNDER_TITLE = "Founder & CEO"
const FOUNDER_ORG = "MOOD MNKY LLC"
const FOUNDER_BIO =
  "Simeon Bowman is the founder and CEO of MOOD MNKY LLC and the MOOD MNKY brand, bringing together bespoke fragrance, community, and innovation in the MNKY VERSE."

export function MainFounderCard() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <MainGlassCard
        role="button"
        tabIndex={0}
        className="main-float main-glass-panel-card flex cursor-pointer flex-col gap-4 p-5 transition-shadow hover:shadow-lg"
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setOpen(true)
          }
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-32 w-32 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/30 text-muted-foreground">
            <User className="h-10 w-10" aria-hidden />
            <span className="mt-1 text-[10px]">Photo coming soon</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-foreground">
              About the Founder
            </h2>
            <p className="mt-1 font-medium text-foreground">{FOUNDER_NAME}</p>
            <p className="text-sm text-muted-foreground">
              {FOUNDER_TITLE}, {FOUNDER_ORG}
            </p>
            <button
              type="button"
              className="mt-2 text-sm font-medium text-primary hover:underline"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(true)
              }}
            >
              Meet the founder →
            </button>
          </div>
        </div>
      </MainGlassCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="main-glass-panel-card max-w-md overflow-y-auto border border-border bg-background/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-left">About the Founder</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div className="flex justify-center">
              <div className="flex h-40 w-40 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/30 text-muted-foreground">
                <User className="h-14 w-14" aria-hidden />
                <span className="mt-1 text-xs">Photo coming soon</span>
              </div>
            </div>
            <p className="font-semibold text-foreground">{FOUNDER_NAME}</p>
            <p className="text-sm text-muted-foreground">
              {FOUNDER_TITLE}, {FOUNDER_ORG} and the MOOD MNKY brand.
            </p>
            <p className="text-sm text-muted-foreground">{FOUNDER_BIO}</p>
            <Button variant="outline" className="w-fit" asChild>
              <a href="/main/contact">Get in touch</a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
