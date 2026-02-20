"use client"

import { BlurFade } from "@/components/ui/blur-fade"
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern"

export interface AuthPageLayoutProps {
  children: React.ReactNode
  /** Optional mascot to display in right half (e.g. login page) */
  mascot?: React.ReactNode
  /** Delay for BlurFade animation */
  blurFadeDelay?: number
}

/**
 * Shared auth page shell: verse-bg + Animated Grid Pattern, optional mascot, BlurFade content.
 * Aligns all auth pages with the Verse landing aesthetic (modern GQ/tech-forward vibe).
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
      {/* Background: Animated Grid Pattern - modern minimal SVG grid with fading squares */}
      <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <AnimatedGridPattern
          numSquares={50}
          maxOpacity={0.25}
          duration={4}
          repeatDelay={0.5}
          width={40}
          height={40}
          className="text-[var(--verse-text-muted)] fill-[var(--verse-text-muted)]/20 stroke-[var(--verse-text-muted)]/20"
        />
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
