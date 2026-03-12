/**
 * MOOD MNKY mascot asset paths for the Main section.
 * Single canonical mascot image used everywhere for consistency.
 */
const MAIN_MASCOT_SINGLE = "/images/main/main-hero-mascot.png"

export const MAIN_MASCOT_ASSETS = {
  hero: MAIN_MASCOT_SINGLE,
  about: MAIN_MASCOT_SINGLE,
  fragrances: MAIN_MASCOT_SINGLE,
  formulas: MAIN_MASCOT_SINGLE,
  collections: MAIN_MASCOT_SINGLE,
  voice: MAIN_MASCOT_SINGLE,
  footer: MAIN_MASCOT_SINGLE,
} as const

export const MAIN_MASCOT_FALLBACK_HERO = "/verse/mood-mnky-3d.png"
