/**
 * Blending calculation helpers for chat tools.
 * Used by calculate_blend_proportions and calculate_wax_for_vessel.
 */

import { CONTAINERS } from "@/lib/data"
import type { ContainerOption } from "@/lib/types"

/** Max fragrance load % by product type (from blending-calculator) */
export const PRODUCT_MAX_LOAD: Record<string, number> = {
  candle: 12,
  soap: 6,
  lotion: 5,
  "room-spray": 10,
  perfume: 30,
  "wax-melt": 15,
}

/** Grams per fluid oz (approximate for wax/fragrance) */
const GRAMS_PER_OZ = 28.35

export interface BlendOilInput {
  oilId: string
  oilName: string
}

export interface BlendProportion {
  oilId: string
  oilName: string
  proportionPct: number
}

/**
 * Calculate suggested blend proportions for given oils.
 * Uses top/middle/base heuristics: base gets more, top gets less.
 * Adjusts based on preferences like "more leather" or "sweeter".
 */
export function calculateBlendProportions(
  oils: BlendOilInput[],
  preferences?: string,
  productType: string = "candle"
): BlendProportion[] {
  const maxLoad = PRODUCT_MAX_LOAD[productType] ?? 10
  if (oils.length === 0) return []

  // Start with even split
  let proportions = oils.map((o) => ({
    oilId: o.oilId,
    oilName: o.oilName,
    proportionPct: Math.round(100 / oils.length),
  }))

  // Adjust last to sum to 100
  const sum = proportions.reduce((s, p) => s + p.proportionPct, 0)
  if (sum !== 100) {
    proportions[proportions.length - 1]!.proportionPct += 100 - sum
  }

  // Apply preferences if provided (simple keyword matching)
  if (preferences && preferences.trim()) {
    const pref = preferences.toLowerCase()
    const adjustments: number[] = new Array(proportions.length).fill(0)
    oils.forEach((oil, i) => {
      const nameLower = oil.oilName.toLowerCase()
      const hasMore =
        pref.includes(`more ${nameLower}`) ||
        nameLower.split(/\s+/).some((k) => pref.includes(`more ${k}`))
      const hasLess =
        pref.includes(`less ${nameLower}`) ||
        nameLower.split(/\s+/).some((k) => pref.includes(`less ${k}`))
      if (hasMore) adjustments[i] = 10
      if (hasLess) adjustments[i] = -10
    })
    const totalAdj = adjustments.reduce((s, a) => s + a, 0)
    if (totalAdj !== 0) {
      // Apply adjustments, clamp, then normalize
      proportions = proportions.map((p, i) => ({
        ...p,
        proportionPct: Math.max(5, Math.min(60, p.proportionPct + adjustments[i]!)),
      }))
      const total = proportions.reduce((s, p) => s + p.proportionPct, 0)
      proportions[proportions.length - 1]!.proportionPct += 100 - total
    }
  }

  return proportions
}

/**
 * Find container by ID or capacity.
 */
export function findContainer(
  containerId?: string,
  capacityOz?: number
): ContainerOption | null {
  if (containerId) {
    return CONTAINERS.find((c) => c.id === containerId) ?? null
  }
  if (capacityOz != null) {
    return CONTAINERS.find((c) => c.capacityOz === capacityOz) ?? null
  }
  return null
}

/**
 * List containers, optionally filtered by capacity.
 */
export function listContainers(capacityOz?: number): ContainerOption[] {
  if (capacityOz != null) {
    return CONTAINERS.filter((c) => c.capacityOz === capacityOz)
  }
  return [...CONTAINERS]
}

/**
 * Calculate wax and fragrance amounts for a vessel.
 * Wax uses ~90% of fill weight (10% fragrance load for candles).
 */
export function calculateWaxForVessel(
  containerId?: string,
  capacityOz?: number,
  fragranceLoadPct: number = 10
): {
  waxGrams: number
  waxOz: number
  fragranceLoadGrams: number
  containerName: string
  capacityOz: number
} | null {
  const container = findContainer(containerId, capacityOz)
  if (!container) return null

  const totalGrams = container.capacityOz * GRAMS_PER_OZ
  const fragranceGrams = totalGrams * (fragranceLoadPct / 100)
  const waxGrams = totalGrams - fragranceGrams

  return {
    waxGrams: Math.round(waxGrams * 10) / 10,
    waxOz: Math.round((waxGrams / GRAMS_PER_OZ) * 10) / 10,
    fragranceLoadGrams: Math.round(fragranceGrams * 10) / 10,
    containerName: container.name,
    capacityOz: container.capacityOz,
  }
}
