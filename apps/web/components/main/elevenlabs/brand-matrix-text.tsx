"use client"

import { cn } from "@/lib/utils"
import { Matrix } from "@/components/ui/matrix"
import {
  patternMOOD,
  patternMNKY,
} from "@/components/ui/matrix-glyphs"

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

export interface BrandMatrixTextProps {
  variant: BrandMatrixVariant
  size?: number
  gap?: number
  className?: string
  /** Default: main-site palette. Override for Verse (e.g. verse-text). */
  palette?: { on: string; off: string }
  /** When true, no animation (static pattern). Respects prefers-reduced-motion. */
  static?: boolean
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

export function BrandMatrixText({
  variant,
  size = 4,
  gap = 1,
  className,
  palette = MAIN_PALETTE,
  static: staticPattern = true,
}: BrandMatrixTextProps) {
  const effectivePalette = palette ?? MAIN_PALETTE

  if (variant === "MOOD MNKY") {
    return (
      <span
        role="img"
        aria-label="MOOD MNKY"
        className={cn("inline-flex items-center gap-0.5 sm:gap-1", className)}
      >
        <SingleMatrix
          variant="MOOD"
          size={size}
          gap={gap}
          palette={effectivePalette}
          ariaHidden
        />
        <SingleMatrix
          variant="MNKY"
          size={size}
          gap={gap}
          palette={MUTED_PALETTE}
          ariaHidden
        />
      </span>
    )
  }

  return (
    <SingleMatrix
      variant={variant}
      size={size}
      gap={gap}
      className={className}
      palette={effectivePalette}
      ariaLabel={variant}
    />
  )
}
