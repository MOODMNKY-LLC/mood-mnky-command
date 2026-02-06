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
  getRelationIds,
} from "@/lib/notion"
import type { NotionPage } from "@/lib/notion"

function mapFormulaPage(page: NotionPage) {
  const p = page.properties
  return {
    notionId: page.id,
    name: getTitle(p["Formula Name"] || p["Name"]),
    description: getRichText(p["Description"]),
    productType: getSelect(p["Product Type"]) || "",
    baseType: getSelect(p["Base Type"]) || "",
    status: getSelect(p["Status"]) || "",
    tags: getMultiSelect(p["Tags"]),
    fragranceLoad: getNumber(p["Fragrance Load %"] || p["Fragrance Load"]) ?? 0,
    totalWeight: getNumber(p["Total Weight"]) ?? 0,
    source: getSelect(p["Source"]) || "",
    wickType: getSelect(p["Wick Type"]) || "",
    waxType: getSelect(p["Wax Type"]) || "",
    fragranceOilIds: getRelationIds(p["Fragrance Oils"] || p["Fragrance Oil"]),
    collectionIds: getRelationIds(p["Collection"] || p["Collections"]),
    notes: getRichText(p["Notes"]),
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
    const pages = await queryAllPages(NOTION_DATABASE_IDS.formulas, {
      sorts: [{ property: "Formula Name", direction: "ascending" }],
    })

    const formulas = pages.map(mapFormulaPage)

    return NextResponse.json({
      formulas,
      total: formulas.length,
      syncedAt: new Date().toISOString(),
      database: "MNKY Formulas",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
