/**
 * Semantic search helpers for fragrance oils.
 * Expands family/category terms to include related note keywords
 * so oils with matching notes (e.g. cinnamon in Gourmand) are found
 * when filtering by "Spicy".
 */

import type { FragranceFamily } from "@/lib/types"

/** Family name -> related note terms for semantic expansion */
export const FAMILY_NOTE_EXPANSION: Record<string, string[]> = {
  Spicy: [
    "cinnamon",
    "clove",
    "ginger",
    "nutmeg",
    "cardamom",
    "saffron",
    "pepper",
    "allspice",
    "anise",
    "cumin",
  ],
  Gourmand: [
    "vanilla",
    "chocolate",
    "caramel",
    "honey",
    "praline",
    "maple",
    "sugar",
    "cream",
    "butter",
    "coffee",
    "marshmallow",
  ],
  Floral: [
    "rose",
    "jasmine",
    "lily",
    "lavender",
    "peony",
    "freesia",
    "magnolia",
    "violet",
    "iris",
    "tuberose",
  ],
  Woody: [
    "sandalwood",
    "cedar",
    "oakmoss",
    "vetiver",
    "patchouli",
    "bark",
    "teak",
    "birch",
    "fir",
  ],
  Citrus: [
    "lemon",
    "orange",
    "bergamot",
    "lime",
    "grapefruit",
    "mandarin",
    "clementine",
    "yuzu",
  ],
  Green: [
    "grass",
    "moss",
    "leaves",
    "herbs",
    "mint",
    "basil",
    "eucalyptus",
    "fern",
  ],
  "Marine/Ozonic": [
    "sea",
    "ocean",
    "salt",
    "ozone",
    "aquatic",
    "rain",
    "water",
  ],
  Amber: [
    "amber",
    "resin",
    "labdanum",
    "tonka",
    "benzoin",
  ],
  Aromatic: [
    "lavender",
    "rosemary",
    "sage",
    "thyme",
    "bay",
  ],
  Fruity: [
    "berry",
    "apple",
    "peach",
    "pear",
    "pineapple",
    "mango",
    "strawberry",
    "blackberry",
    "melon",
  ],
}

/**
 * Get expanded search terms for a family or free-text query.
 * When family matches a known category, returns family + expansion terms.
 * Otherwise returns the original query terms.
 */
export function getExpandedSearchTerms(
  query: string,
  family: FragranceFamily | null
): string[] {
  const terms = new Set<string>()
  const q = query.trim().toLowerCase()
  if (q) {
    q.split(/\s+/).filter(Boolean).forEach((t) => terms.add(t))
  }
  if (family) {
    terms.add(family.toLowerCase())
    const expansion = FAMILY_NOTE_EXPANSION[family]
    if (expansion) {
      expansion.forEach((t) => terms.add(t))
    }
  }
  return Array.from(terms)
}

/**
 * Check if an oil matches any of the expanded search terms.
 * Searches across name, family, description, and all note arrays.
 */
export function oilMatchesTerms(
  oil: {
    name: string
    family: string
    description?: string
    topNotes?: string[]
    middleNotes?: string[]
    baseNotes?: string[]
    subfamilies?: string[]
    blendsWellWith?: string[]
    alternativeBranding?: string[]
  },
  terms: string[]
): boolean {
  if (terms.length === 0) return true
  const searchable = [
    oil.name,
    oil.family,
    oil.description ?? "",
    ...(oil.topNotes ?? []),
    ...(oil.middleNotes ?? []),
    ...(oil.baseNotes ?? []),
    ...(oil.subfamilies ?? []),
    ...(oil.blendsWellWith ?? []),
    ...(oil.alternativeBranding ?? []),
  ]
    .join(" ")
    .toLowerCase()
  return terms.some((t) => searchable.includes(t))
}

/** Normalize note name to slug for glossary lookup */
export function noteToSlug(note: string): string {
  return note
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}
