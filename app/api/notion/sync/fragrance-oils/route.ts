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
