"use client"

import { BlurFade } from "@/components/ui/blur-fade"
import { DottedMap } from "@/components/ui/dotted-map"

export interface AuthPageLayoutProps {
  children: React.ReactNode
  /** Optional mascot to display in right half (e.g. login page) */
  mascot?: React.ReactNode
  /** Delay for BlurFade animation */
  blurFadeDelay?: number
}

/**
 * Shared auth page shell: verse-bg + DottedMap background, optional mascot, BlurFade content.
 * Aligns all auth pages with the Verse landing aesthetic.
 * When mascot is provided: content centered, mascot in right half.
 */
export function AuthPageLayout({
  children,
  mascot,
  blurFadeDelay = 0.1,
}: AuthPageLayoutProps) {
  const hasMascot = Boolean(mascot)

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-[var(--verse-bg)] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {/* Background: DottedMap - subtle tech-forward aesthetic */}
      <div className="fixed inset-0 -z-10 flex items-center justify-center overflow-hidden opacity-[0.15] pointer-events-none">
        <div className="relative h-full w-full min-h-[280px] min-w-[320px]">
          <DottedMap
            width={200}
            height={100}
            mapSamples={4000}
            dotRadius={0.15}
            className="h-full w-full text-[var(--verse-text)]"
          />
        </div>
      </div>

      {/* Mascot - right half (when present) */}
      {hasMascot && (
        <div className="fixed inset-0 z-10 left-1/2 right-0 top-0 bottom-0 flex items-center justify-center pointer-events-none">
          {mascot}
        </div>
      )}

      {/* Content - centered */}
      <BlurFade delay={blurFadeDelay} inView className="relative z-20">
        {children}
      </BlurFade>
    </div>
  )
}
