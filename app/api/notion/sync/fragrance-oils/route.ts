import { NextResponse } from "next/server"
import {
  queryAllPages,
  NOTION_DATABASE_IDS,
  isConfigured,
  getTitle,
  getRichText,
  getSelect,
  getMultiSelect,
  getNumber,
  getCheckbox,
  getUrl,
} from "@/lib/notion"
import type { NotionPage } from "@/lib/notion"
import { createAdminClient } from "@/lib/supabase/admin"

function mapFragranceOilPage(page: NotionPage) {
  const p = page.properties
  return {
    notionId: page.id,
    name: getTitle(p["Fragrance Name"] || p["Name"]),
    description: getRichText(p["Description"]),
    family: getSelect(p["Family"]) || "",
    subfamilies: getMultiSelect(p["Sub Families"] || p["Subfamilies"]),
    topNotes: getMultiSelect(p["Top Notes"]),
    middleNotes: getMultiSelect(p["Middle Notes"]),
    baseNotes: getMultiSelect(p["Base Notes"]),
    type: getSelect(p["Type"]) || "Fragrance Oil",
    alternativeBranding: getMultiSelect(p["Alternative Branding"]),
    candleSafe: getCheckbox(p["Candle Safe"]),
    soapSafe: getCheckbox(p["Soap Safe"]),
    lotionSafe: getCheckbox(p["Lotion Safe"]),
    perfumeSafe: getCheckbox(p["Perfume Safe"]),
    roomSpraySafe: getCheckbox(p["Room Spray Safe"]),
    waxMeltSafe: getCheckbox(p["Wax Melt Safe"]),
    maxUsageCandle: getNumber(p["Max Usage Candle"]) ?? 0,
    maxUsageSoap: getNumber(p["Max Usage Soap"]) ?? 0,
    maxUsageLotion: getNumber(p["Max Usage Lotion"]) ?? 0,
    price1oz: getNumber(p["Price 1oz"]) ?? 0,
    price4oz: getNumber(p["Price 4oz"]) ?? 0,
    price16oz: getNumber(p["Price 16oz"]) ?? 0,
    rating: getNumber(p["Rating"]) ?? 0,
    reviewCount: getNumber(p["Review Count"]) ?? 0,
    blendsWellWith: getMultiSelect(p["Blends Well With"]),
    suggestedColors: getMultiSelect(p["Suggested Colors"]),
    allergenStatement: getUrl(p["Allergen Statement"]),
    lastEdited: page.last_edited_time,
    notionUrl: page.url,
  }
}

function toDbRow(item: ReturnType<typeof mapFragranceOilPage>) {
  return {
    notion_id: item.notionId,
    name: item.name,
    description: item.description || "",
    family: item.family || "",
    type: item.type || "Fragrance Oil",
    subfamilies: item.subfamilies || [],
    top_notes: item.topNotes || [],
    middle_notes: item.middleNotes || [],
    base_notes: item.baseNotes || [],
    alternative_branding: item.alternativeBranding || [],
    blends_well_with: item.blendsWellWith || [],
    suggested_colors: item.suggestedColors || [],
    candle_safe: item.candleSafe ?? true,
    soap_safe: item.soapSafe ?? false,
    lotion_safe: item.lotionSafe ?? false,
    perfume_safe: item.perfumeSafe ?? false,
    room_spray_safe: item.roomSpraySafe ?? false,
    wax_melt_safe: item.waxMeltSafe ?? false,
    max_usage_candle: item.maxUsageCandle ?? 0,
    max_usage_soap: item.maxUsageSoap ?? 0,
    max_usage_lotion: item.maxUsageLotion ?? 0,
    price_1oz: item.price1oz ?? 0,
    price_4oz: item.price4oz ?? 0,
    price_16oz: item.price16oz ?? 0,
    rating: item.rating ?? 0,
    review_count: item.reviewCount ?? 0,
    allergen_statement: item.allergenStatement ?? null,
    notion_url: item.notionUrl ?? null,
    last_edited_at: item.lastEdited ? new Date(item.lastEdited).toISOString() : null,
    updated_at: new Date().toISOString(),
  }
}

export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Notion is not configured. Add NOTION_API_KEY environment variable." },
      { status: 503 }
    )
  }

  try {
    const pages = await queryAllPages(NOTION_DATABASE_IDS.fragranceOils, {
      sorts: [{ property: "Fragrance Name", direction: "ascending" }],
    })

    const fragranceOils = pages.map(mapFragranceOilPage)

    return NextResponse.json({
      fragranceOils,
      total: fragranceOils.length,
      syncedAt: new Date().toISOString(),
      database: "MNKY Science Fragrance Oils",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST() {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Notion is not configured. Add NOTION_API_KEY environment variable." },
      { status: 503 }
    )
  }

  const supabase = createAdminClient()

  try {
    const pages = await queryAllPages(NOTION_DATABASE_IDS.fragranceOils, {
      sorts: [{ property: "Fragrance Name", direction: "ascending" }],
    })

    const mapped = pages.map(mapFragranceOilPage)
    const rows = mapped.map(toDbRow)

    const { data: upserted, error: upsertError } = await supabase
      .from("fragrance_oils")
      .upsert(rows, {
        onConflict: "notion_id",
        ignoreDuplicates: false,
      })
      .select("id")

    if (upsertError) {
      throw new Error(upsertError.message)
    }

    const recordsSynced = upserted?.length ?? rows.length

    await supabase.from("sync_logs").insert({
      source: "notion",
      entity_type: "fragrance_oils",
      records_synced: recordsSynced,
      status: "success",
    })

    return NextResponse.json({
      success: true,
      recordsSynced,
      total: rows.length,
      syncedAt: new Date().toISOString(),
      database: "MNKY Science Fragrance Oils",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"

    try {
      await supabase.from("sync_logs").insert({
        source: "notion",
        entity_type: "fragrance_oils",
        records_synced: 0,
        status: "error",
        error_message: message,
      })
    } catch {
      // ignore sync_log insert failure
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
