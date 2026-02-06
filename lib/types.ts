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
  totalWeight: number // grams
  source: "whole-elise" | "mood-mnky" | "custom"
  tags: string[]
  createdAt: string
}

// ---- Fragrance Oils ----
export interface FragranceOil {
  id: string
  name: string
  description: string
  topNotes: string[]
  middleNotes: string[]
  baseNotes: string[]
  category: string
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
