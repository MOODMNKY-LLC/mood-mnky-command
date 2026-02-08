import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { FragranceOil, FragranceFamily } from "@/lib/types"

function dbRowToFragranceOil(row: {
  id: string
  notion_id: string
  name: string
  description: string | null
  family: string | null
  type: string | null
  subfamilies: string[] | null
  top_notes: string[] | null
  middle_notes: string[] | null
  base_notes: string[] | null
  alternative_branding: string[] | null
  blends_well_with: string[] | null
  suggested_colors: string[] | null
  candle_safe: boolean
  soap_safe: boolean
  lotion_safe: boolean
  perfume_safe: boolean
  room_spray_safe: boolean
  wax_melt_safe: boolean
  max_usage_candle: number
  max_usage_soap: number
  max_usage_lotion: number
  price_1oz: number
  price_4oz: number
  price_16oz: number
  rating: number
  review_count: number
  notion_url: string | null
}): FragranceOil {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    family: (row.family ?? "Floral") as FragranceFamily,
    subfamilies: (row.subfamilies ?? []) as FragranceFamily[],
    topNotes: row.top_notes ?? [],
    middleNotes: row.middle_notes ?? [],
    baseNotes: row.base_notes ?? [],
    type: (row.type === "Blending Element" ? "Blending Element" : "Fragrance Oil") as FragranceOil["type"],
    candleSafe: row.candle_safe ?? true,
    soapSafe: row.soap_safe ?? false,
    lotionSafe: row.lotion_safe ?? false,
    perfumeSafe: row.perfume_safe ?? false,
    roomSpraySafe: row.room_spray_safe ?? false,
    waxMeltSafe: row.wax_melt_safe ?? false,
    maxUsageCandle: Number(row.max_usage_candle) ?? 0,
    maxUsageSoap: Number(row.max_usage_soap) ?? 0,
    maxUsageLotion: Number(row.max_usage_lotion) ?? 0,
    price1oz: Number(row.price_1oz) ?? 0,
    price4oz: Number(row.price_4oz) ?? 0,
    price16oz: Number(row.price_16oz) ?? 0,
    rating: Number(row.rating) ?? 0,
    reviewCount: Number(row.review_count) ?? 0,
    blendsWellWith: row.blends_well_with ?? [],
    alternativeBranding: row.alternative_branding ?? [],
    suggestedColors: row.suggested_colors ?? [],
    notionUrl: row.notion_url ?? null,
  }
}

export async function GET() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("fragrance_oils")
    .select("*, notion_url")
    .order("name")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const fragranceOils = (data ?? []).map(dbRowToFragranceOil)

  return NextResponse.json({
    fragranceOils,
    total: fragranceOils.length,
  })
}
