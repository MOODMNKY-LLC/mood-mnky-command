"use client"

import { useState } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"
import { BlurFade } from "@/components/ui/blur-fade"
import { useMainTalkToAgent } from "@/components/main/main-talk-to-agent-context"
import { BrandMatrixText } from "@/components/main/elevenlabs/brand-matrix-text"
import { MAIN_ABOUT_FOUNDER, MAIN_ABOUT_BRAND } from "@/lib/main-about-data"
import { cn } from "@/lib/utils"

/** Founder: card/split panel uses shirt; dialog uses hat. */
const FOUNDER_IMAGE_PANEL = "/images/main/founder-shirt.png"
const FOUNDER_IMAGE_DIALOG = "/images/main/founder-hat.png"

/** 3D mascot for the brand side of the split (brain child). */
const MASCOT_3D_IMAGE = "/verse/mood-mnky-3d.png"

export interface MainAboutSplitSectionProps {
  className?: string
}

/**
 * About Us split section: Founder (left) and MOOD MNKY — his brain child (right).
 * Uses deep-research layout: dual narrative, equal-weight panels, glass styling.
 */
export function MainAboutSplitSection({ className }: MainAboutSplitSectionProps) {
  const [founderDialogOpen, setFounderDialogOpen] = useState(false)
  const [panelImgError, setPanelImgError] = useState(false)
  const [dialogImgError, setDialogImgError] = useState(false)
  const talk = useMainTalkToAgent()

  return (
    <>
      <BlurFade
        delay={0.08}
        inView
        inViewMargin="-20px"
        className={cn("w-full", className)}
      >
        <section
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12"
          style={{ marginTop: "var(--main-section-gap)" }}
          aria-labelledby="about-split-heading"
        >
          <h2 id="about-split-heading" className="sr-only">
            About: The Founder and MOOD MNKY
          </h2>

          {/* Left: The Founder */}
          <div className="main-glass-panel flex flex-col rounded-2xl border border-border p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="relative mx-auto h-40 w-40 shrink-0 overflow-hidden rounded-xl border border-border bg-muted/30 md:h-48 md:w-48">
                {!panelImgError ? (
                  <Image
                    src={FOUNDER_IMAGE_PANEL}
                    alt={`${MAIN_ABOUT_FOUNDER.name}, ${MAIN_ABOUT_FOUNDER.title}`}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 192px, 224px"
                    onError={() => setPanelImgError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                    <User className="h-12 w-12" aria-hidden />
                    <span className="mt-1 text-xs">Photo</span>
                  </div>
                )}
              </div>
              <div className="space-y-1 text-center md:text-left">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  The Founder
                </p>
                <h3 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                  {MAIN_ABOUT_FOUNDER.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {MAIN_ABOUT_FOUNDER.title}, {MAIN_ABOUT_FOUNDER.org}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{MAIN_ABOUT_FOUNDER.panelBio}</p>
              <Button
                variant="outline"
                className="w-fit"
                onClick={() => setFounderDialogOpen(true)}
              >
                Meet the founder
              </Button>
            </div>
          </div>

          {/* Right: MOOD MNKY — brain child (card mirrors founder side) */}
          <div className="main-glass-panel flex flex-col rounded-2xl border border-border p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="relative mx-auto h-48 w-48 shrink-0 overflow-hidden rounded-xl border border-border bg-muted/30 md:h-56 md:w-56">
                <Image
                  src={MASCOT_3D_IMAGE}
                  alt="MOOD MNKY mascot"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 192px, 224px"
                />
              </div>
              <div className="space-y-1 text-center md:text-left">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  The brain child
                </p>
                <h3 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                  <BrandMatrixText variant="MOOD MNKY" size={4} gap={1} className="inline-block h-7 md:h-8" />
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {MAIN_ABOUT_BRAND.panelBio}
              </p>
              <Button
                variant="outline"
                className="w-fit"
                onClick={() => talk?.openDialog()}
              >
                Meet MOOD MNKY
              </Button>
            </div>
          </div>
        </section>
      </BlurFade>

      <Dialog open={founderDialogOpen} onOpenChange={setFounderDialogOpen}>
        <DialogContent className="main-glass-panel-card max-w-md overflow-y-auto border border-border bg-background/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-left">About the Founder</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div className="relative mx-auto h-40 w-40 shrink-0 overflow-hidden rounded-xl border border-border bg-muted/30">
              {!dialogImgError ? (
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
                  <span className="mt-1 text-xs">Photo</span>
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
