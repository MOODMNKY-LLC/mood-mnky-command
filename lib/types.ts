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

// Colors for each family on the fragrance wheel
export const FAMILY_COLORS: Record<FragranceFamily, string> = {
  Spicy: "#c0392b",
  Gourmand: "#d35400",
  Amber: "#e67e22",
  Woody: "#795548",
  Aromatic: "#27ae60",
  Floral: "#e91e90",
  Citrus: "#f1c40f",
  "Marine/Ozonic": "#3498db",
  Green: "#2ecc71",
  Fruity: "#e74c8c",
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

export const FAMILY_COMPLEMENTARY: Record<FragranceFamily, FragranceFamily> = {
  Spicy: "Aromatic",
  Gourmand: "Floral",
  Amber: "Citrus",
  Woody: "Marine/Ozonic",
  Aromatic: "Spicy",
  Floral: "Gourmand",
  Citrus: "Amber",
  "Marine/Ozonic": "Woody",
  Green: "Gourmand",
  Fruity: "Woody",
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

// ---- Product Types ----
export type ProductType =
  | "candle"
  | "soap"
  | "lotion"
  | "room-spray"
  | "perfume"
  | "wax-melt"

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  candle: "Candle",
  soap: "Bar Soap",
  lotion: "Lotion",
  "room-spray": "Room Spray",
  perfume: "Perfume",
  "wax-melt": "Wax Melt",
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
}
