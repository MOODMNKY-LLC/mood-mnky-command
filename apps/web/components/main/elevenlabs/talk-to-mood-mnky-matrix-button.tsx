"use client"

import { useEffect, useState } from "react"
import { Matrix } from "@/components/ui/matrix"
import {
  scrollFramesTalkToMoodMnky,
  TALK_TO_MOOD_MNKY_SCROLL_FPS,
  TALK_TO_MOOD_MNKY_VISIBLE_COLS,
  GLYPH_ROWS,
} from "@/components/ui/matrix-glyphs"
import { cn } from "@/lib/utils"

/** Button-like: foreground text on muted fill so the matrix reads as a solid CTA surface. */
const HERO_BUTTON_PALETTE = {
  on: "hsl(var(--foreground))",
  off: "hsl(var(--muted))",
}

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mq.matches)
    const handler = () => setPrefersReducedMotion(mq.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return prefersReducedMotion
}

export interface TalkToMoodMnkyMatrixButtonProps {
  className?: string
  /** Scroll target id (e.g. "voice-block") for onClick. */
  scrollTargetId?: string
}

export function TalkToMoodMnkyMatrixButton({
  className,
  scrollTargetId = "voice-block",
}: TalkToMoodMnkyMatrixButtonProps) {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <button
      type="button"
      className={cn(
        "main-btn-float inline-flex items-center justify-center text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      aria-label="Talk to MOOD MNKY"
      onClick={() =>
        document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: "smooth" })
      }
    >
      <Matrix
        rows={GLYPH_ROWS}
        cols={TALK_TO_MOOD_MNKY_VISIBLE_COLS}
        frames={reducedMotion ? [scrollFramesTalkToMoodMnky[0]] : scrollFramesTalkToMoodMnky}
        fps={TALK_TO_MOOD_MNKY_SCROLL_FPS}
        autoplay={!reducedMotion}
        loop={!reducedMotion}
        size={3}
        gap={1}
        palette={HERO_BUTTON_PALETTE}
        aria-hidden
        className="pointer-events-none inline-block"
      />
    </button>
  )
}
