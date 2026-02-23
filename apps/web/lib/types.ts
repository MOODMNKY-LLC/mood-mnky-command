// ---- CandleScience Fragrance Wheel Families ----
export const FRAGRANCE_FAMILIES = [
  "Spicy",
  "Gourmand",
  "Amber",
  "Woody",
  "Aromatic",
  "Floral",
  "Citrus",
  "Marine/Ozonic",
  "Green",
  "Fruity",
] as const

export type FragranceFamily = (typeof FRAGRANCE_FAMILIES)[number]

// Seasonal mapping from the CandleScience wheel
export const FAMILY_SEASONS: Record<FragranceFamily, string> = {
  Spicy: "Fall",
  Gourmand: "Fall",
  Amber: "Winter",
  Woody: "Winter",
  Aromatic: "Fall",
  Floral: "Spring",
  Citrus: "Summer",
  "Marine/Ozonic": "Summer",
  Green: "Summer",
  Fruity: "Spring",
}

// Colors for each family on the fragrance wheel (matches CandleScience PDF)
export const FAMILY_COLORS: Record<FragranceFamily, string> = {
  Spicy: "#d8514e",
  Gourmand: "#e7a151",
  Amber: "#bd723d",
  Woody: "#66453e",
  Aromatic: "#5c64a7",
  Floral: "#dd7edd",
  Citrus: "#f9d96e",
  "Marine/Ozonic": "#6ec4e8",
  Green: "#7dc27d",
  Fruity: "#f89e5c",
}

// Blending relationship: kindred families are adjacent on the wheel, complementary are opposite
export const FAMILY_KINDRED: Record<FragranceFamily, FragranceFamily[]> = {
  Spicy: ["Gourmand", "Fruity"],
  Gourmand: ["Spicy", "Amber"],
  Amber: ["Gourmand", "Woody"],
  Woody: ["Amber", "Aromatic"],
  Aromatic: ["Woody", "Floral"],
  Floral: ["Aromatic", "Citrus"],
  Citrus: ["Floral", "Marine/Ozonic"],
  "Marine/Ozonic": ["Citrus", "Green"],
  Green: ["Marine/Ozonic", "Fruity"],
  Fruity: ["Green", "Spicy"],
}

// Complementary = directly across the wheel (geometry-derived)
const HALF_WHEEL = FRAGRANCE_FAMILIES.length / 2
export const FAMILY_COMPLEMENTARY: Record<FragranceFamily, FragranceFamily> =
  Object.fromEntries(
    FRAGRANCE_FAMILIES.map((family, i) => [
      family,
      FRAGRANCE_FAMILIES[(i + HALF_WHEEL) % FRAGRANCE_FAMILIES.length],
    ])
  ) as Record<FragranceFamily, FragranceFamily>

/** Safe family color for styles; use when family may not be in wheel (e.g. API data). */
export function getFamilyColor(family: string | null | undefined): string {
  if (!family) return "#888888"
  return FAMILY_COLORS[family as FragranceFamily] ?? "#888888"
}

// ---- Wick Types ----
export type WickType = "cotton" | "wood"

export interface WickOption {
  id: string
  type: WickType
  name: string
  series: string
  size: string
  recommendedDiameter: string // e.g. "3-3.5 inches"
  compatibleWaxes: string[]
  compatibleContainers: string[]
  notes: string
}

// ---- Wax Types ----
export interface WaxType {
  id: string
  name: string
  type: "soy" | "coconut" | "parasoy" | "coco-soy" | "beeswax" | "paraffin"
  maxFragranceLoad: number // percentage
  meltPoint: string
  description: string
  bestFor: string[]
  compatibleWicks: WickType[]
}

// ---- Formula Categories (Whole Elise / DB) ----
export type FormulaCategory = "skincare" | "haircare" | "diy" | "candle"

export const FORMULA_CATEGORY_LABELS: Record<FormulaCategory, string> = {
  skincare: "Skincare",
  haircare: "Haircare",
  diy: "DIY",
  candle: "Candle",
}

// ---- Product Types ----
export type ProductType =
  | "candle"
  | "soap"
  | "lotion"
  | "room-spray"
  | "perfume"
  | "wax-melt"
  | "skincare"
  | "haircare"
  | "body-butter"
  | "lip-balm"
  | "shampoo"
  | "conditioner"
  | "cleanser"

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  candle: "Candle",
  soap: "Bar Soap",
  lotion: "Lotion",
  "room-spray": "Room Spray",
  perfume: "Perfume",
  "wax-melt": "Wax Melt",
  skincare: "Skincare",
  haircare: "Haircare",
  "body-butter": "Body Butter",
  "lip-balm": "Lip Balm",
  shampoo: "Shampoo",
  conditioner: "Conditioner",
  cleanser: "Cleanser",
}

// ---- Formula System ----
export interface Ingredient {
  id: string
  name: string
  function: string
  percentage: number
  isFragranceOil?: boolean
  fragranceOilId?: string
}

export interface Phase {
  id: string
  name: string
  ingredients: Ingredient[]
}

export interface Formula {
  id: string
  name: string
  productType: ProductType
  description: string
  phases: Phase[]
  totalWeight: number
  source: "whole-elise" | "mood-mnky" | "custom"
  tags: string[]
  wickType?: WickType
  waxType?: string
  createdAt: string
  /** DB-backed: category from formula_categories */
  categoryId?: FormulaCategory
  /** DB-backed: link to original tutorial */
  externalUrl?: string
}

// ---- Fragrance Notes Glossary ----
export interface FragranceNote {
  id: string
  name: string
  slug: string
  descriptionShort: string
  olfactiveProfile: string
  facts: string
  createdAt: string
  updatedAt: string
}

// ---- Fragrance Oils ----
export interface FragranceOil {
  id: string
  name: string
  description: string
  family: FragranceFamily
  subfamilies: FragranceFamily[] // secondary families present in this oil
  topNotes: string[]
  middleNotes: string[]
  baseNotes: string[]
  type: "Fragrance Oil" | "Blending Element"
  candleSafe: boolean
  soapSafe: boolean
  lotionSafe: boolean
  perfumeSafe: boolean
  roomSpraySafe: boolean
  waxMeltSafe: boolean
  maxUsageCandle: number
  maxUsageSoap: number
  maxUsageLotion: number
  price1oz: number
  price4oz: number
  price16oz: number
  rating: number
  reviewCount: number
  blendsWellWith: string[]
  alternativeBranding: string[]
  suggestedColors: string[]
  /** Notion page URL, present when synced from Notion */
  notionUrl?: string | null
  /** Notion page ID for API updates */
  notionId?: string | null
  /** CDN URL for fragrance scene/image */
  imageUrl?: string | null
  /** Thumbnail URL (300px, WebP) - when imageUrl is Supabase storage */
  thumbnailUrl?: string | null
  /** notional | supabase | ai-generated */
  imageSource?: string | null
  /** Allergen statement URL or text from Notion */
  allergenStatement?: string | null
}

// ---- Container Types (CandleScience catalog) ----
export type ContainerMaterial = "glass" | "tin" | "ceramic"

export interface ContainerOption {
  id: string
  name: string
  material: ContainerMaterial
  capacity: string // e.g. "8 oz"
  capacityOz: number
  diameter: string // inches
  diameterInches: number
  compatibleWicks: string[] // wick option ids
  price: number
  bulkPrice?: number
  suggestedRetail: number
  source: "candlescience" | "custom"
}

// ---- Fragrance Blending ----
export interface BlendComponent {
  fragranceOilId: string
  percentage: number
}

export interface FragranceBlend {
  id: string
  name: string
  components: BlendComponent[]
  productType: ProductType
  fragranceLoadPercent: number
  totalBatchWeight: number
  notes: string
}

// ---- Dashboard Stats ----
export interface DashboardStats {
  totalFormulas: number
  totalFragrances: number
  totalProducts: number
  recentActivity: ActivityItem[]
}

export interface ActivityItem {
  id: string
  action: string
  target: string
  timestamp: string
  /** Source of the activity for optional badge (e.g. Shopify, Notion). */
  source?: "shopify" | "notion" | "supabase"
}
