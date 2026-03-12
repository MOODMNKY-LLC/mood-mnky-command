"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Matrix } from "@/components/ui/matrix"
import {
  patternMOOD,
  patternMNKY,
} from "@/components/ui/matrix-glyphs"
import {
  createFlickerFrames,
  createPulseFrames,
} from "@/components/ui/matrix-presets"
import type { Frame } from "@/components/ui/matrix"

/** Theme-adaptive; off is visible per ElevenLabs Matrix docs (muted but visible grid). */
const MAIN_PALETTE = {
  on: "hsl(var(--foreground))",
  off: "hsl(var(--muted-foreground) / 0.25)",
}

/** Muted (dimmer) for visual offset when MOOD is bright and MNKY is muted. */
const MUTED_PALETTE = {
  on: "hsl(var(--muted-foreground))",
  off: "hsl(var(--muted-foreground) / 0.15)",
}

export type BrandMatrixVariant = "MOOD" | "MNKY" | "MOOD MNKY"

export type BrandMatrixAnimation = "static" | "flicker" | "pulse"

export interface BrandMatrixTextProps {
  variant: BrandMatrixVariant
  size?: number
  gap?: number
  className?: string
  /** Default: main-site palette. Override for Verse (e.g. verse-text). */
  palette?: { on: string; off: string }
  /** When true, no animation (static pattern). Respects prefers-reduced-motion. */
  static?: boolean
  /** Animation: static (default), flicker (slow brightness), or pulse (breathing). Ignored when prefers-reduced-motion. */
  animation?: BrandMatrixAnimation
}

const PATTERNS: Record<Exclude<BrandMatrixVariant, "MOOD MNKY">, { rows: number; cols: number; pattern: number[][] }> = {
  MOOD: {
    rows: patternMOOD.length,
    cols: patternMOOD[0].length,
    pattern: patternMOOD,
  },
  MNKY: {
    rows: patternMNKY.length,
    cols: patternMNKY[0].length,
    pattern: patternMNKY,
  },
}

function SingleMatrix({
  variant,
  size,
  gap,
  className,
  palette,
  ariaLabel,
  ariaHidden,
}: {
  variant: "MOOD" | "MNKY"
  size: number
  gap: number
  className?: string
  palette: { on: string; off: string }
  ariaLabel?: string
  ariaHidden?: boolean
}) {
  const { rows, cols, pattern } = PATTERNS[variant]
  return (
    <Matrix
      rows={rows}
      cols={cols}
      pattern={pattern}
      size={size}
      gap={gap}
      palette={palette}
      ariaLabel={ariaLabel}
      autoplay={false}
      aria-hidden={ariaHidden}
      className={cn("pointer-events-none inline-block align-middle", className)}
    />
  )
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

export function BrandMatrixText({
  variant,
  size = 4,
  gap = 1,
  className,
  palette = MAIN_PALETTE,
  static: staticPattern = true,
  animation = "static",
}: BrandMatrixTextProps) {
  const effectivePalette = palette ?? MAIN_PALETTE
  const prefersReducedMotion = usePrefersReducedMotion()
  const useAnimation =
    !staticPattern &&
    !prefersReducedMotion &&
    (animation === "flicker" || animation === "pulse")

  const getFrames = (pattern: Frame): Frame[] | undefined => {
    if (!useAnimation) return undefined
    if (animation === "flicker") return createFlickerFrames(pattern)
    if (animation === "pulse") return createPulseFrames(pattern)
    return undefined
  }

  if (variant === "MOOD MNKY") {
    const moodFrames = useAnimation ? getFrames(PATTERNS.MOOD.pattern) : undefined
    const mnkyFrames = useAnimation ? getFrames(PATTERNS.MNKY.pattern) : undefined
    return (
      <span
        role="img"
        aria-label="MOOD MNKY"
        className={cn("inline-flex items-center gap-2 sm:gap-3", className)}
      >
        <SingleMatrix
          variant="MOOD"
          size={size}
          gap={gap}
          palette={effectivePalette}
          ariaHidden
          frames={moodFrames}
          fps={8}
          autoplay={!!moodFrames}
          loop={!!moodFrames}
        />
        <SingleMatrix
          variant="MNKY"
          size={size}
          gap={gap}
          palette={MUTED_PALETTE}
          ariaHidden
          frames={mnkyFrames}
          fps={8}
          autoplay={!!mnkyFrames}
          loop={!!mnkyFrames}
        />
      </span>
    )
  }

  const frames = useAnimation ? getFrames(PATTERNS[variant].pattern) : undefined
  return (
    <SingleMatrix
      variant={variant}
      size={size}
      gap={gap}
      className={className}
      palette={effectivePalette}
      ariaLabel={variant}
      frames={frames}
      fps={8}
      autoplay={!!frames}
      loop={!!frames}
    />
  )
}
