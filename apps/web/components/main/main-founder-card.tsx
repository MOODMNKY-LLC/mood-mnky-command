"use client"

import { useState } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MainGlassCard } from "@/components/main/main-glass-card"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"
import { MAIN_ABOUT_FOUNDER } from "@/lib/main-about-data"

/** Card thumbnail: shirt version (MOODMNKY branding). Dialog: hat version. */
const FOUNDER_IMAGE_CARD = "/images/main/founder-shirt.png"
const FOUNDER_IMAGE_DIALOG = "/images/main/founder-hat.png"

export function MainFounderCard() {
  const [open, setOpen] = useState(false)
  const [cardImgError, setCardImgError] = useState(false)
  const [dialogImgError, setDialogImgError] = useState(false)
  const showCardImage = !cardImgError
  const showDialogImage = !dialogImgError

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
          <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl border border-border bg-muted/30">
            {showCardImage ? (
              <Image
                src={FOUNDER_IMAGE_CARD}
                alt={`${MAIN_ABOUT_FOUNDER.name}, ${MAIN_ABOUT_FOUNDER.title}`}
                fill
                className="object-cover object-center"
                sizes="128px"
                onError={() => setCardImgError(true)}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                <User className="h-10 w-10" aria-hidden />
                <span className="mt-1 text-[10px]">Photo coming soon</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-foreground">
              About the Founder
            </h2>
            <p className="mt-1 font-medium text-foreground">{MAIN_ABOUT_FOUNDER.name}</p>
            <p className="text-sm text-muted-foreground">
              {MAIN_ABOUT_FOUNDER.title}, {MAIN_ABOUT_FOUNDER.org}
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
            <div className="relative mx-auto h-40 w-40 shrink-0 overflow-hidden rounded-xl border border-border bg-muted/30">
              {showDialogImage ? (
                <Image
                  src={FOUNDER_IMAGE_DIALOG}
                  alt={`${MAIN_ABOUT_FOUNDER.name}, ${MAIN_ABOUT_FOUNDER.title}`}
                  fill
                  className="object-cover object-center"
                  sizes="160px"
                  onError={() => setDialogImgError(true)}
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                  <User className="h-14 w-14" aria-hidden />
                  <span className="mt-1 text-xs">Photo coming soon</span>
                </div>
              )}
            </div>
            <p className="font-semibold text-foreground">{MAIN_ABOUT_FOUNDER.name}</p>
            <p className="text-sm text-muted-foreground">
              {MAIN_ABOUT_FOUNDER.title}, {MAIN_ABOUT_FOUNDER.org} and the MOOD MNKY brand.
            </p>
            <p className="text-sm text-muted-foreground">{MAIN_ABOUT_FOUNDER.dialogBio}</p>
            <Button variant="outline" className="w-fit" asChild>
              <a href={MAIN_ABOUT_FOUNDER.ctaHref}>{MAIN_ABOUT_FOUNDER.ctaLabel}</a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
