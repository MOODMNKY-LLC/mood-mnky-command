/**
 * Animation presets for Matrix: flicker (slow brightness oscillation) and pulse (breathing).
 * Used by BrandMatrixText when animation="flicker" or "pulse".
 */

import type { Frame } from "@/components/ui/matrix"

const FLICKER_FRAMES = 24
const PULSE_FRAMES = 20

/**
 * Generates frames with slow brightness oscillation (sine) for each "on" cell.
 * Creates a gentle flicker effect. Off cells stay 0.
 */
export function createFlickerFrames(base: Frame, numFrames: number = FLICKER_FRAMES): Frame[] {
  const rows = base.length
  const cols = base[0].length
  const frames: Frame[] = []
  for (let f = 0; f < numFrames; f++) {
    const phase = (f / numFrames) * Math.PI * 2
    const intensity = 0.5 + 0.5 * Math.sin(phase)
    const frame = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => {
        const v = base[r]?.[c] ?? 0
        return v > 0 ? v * intensity : 0
      })
    )
    frames.push(frame)
  }
  return frames
}

/**
 * Generates frames with a global "breathing" pulse: all on cells scale together from ~0.7 to 1.
 */
export function createPulseFrames(base: Frame, numFrames: number = PULSE_FRAMES): Frame[] {
  const rows = base.length
  const cols = base[0].length
  const frames: Frame[] = []
  for (let f = 0; f < numFrames; f++) {
    const phase = (f / numFrames) * Math.PI * 2
    const scale = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(phase))
    const frame = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => {
        const v = base[r]?.[c] ?? 0
        return v > 0 ? v * scale : 0
      })
    )
    frames.push(frame)
  }
  return frames
}
