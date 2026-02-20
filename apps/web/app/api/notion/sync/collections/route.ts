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
  getRelationIds,
} from "@/lib/notion"
import type { NotionPage } from "@/lib/notion"

function mapCollectionPage(page: NotionPage) {
  const p = page.properties
  return {
    notionId: page.id,
    name: getTitle(p["Collection Name"] || p["Name"]),
    description: getRichText(p["Collection Description"] || p["Description"]),
    collectionType: getSelect(p["Collection Type"]) || "",
    season: getSelect(p["Season"]) || "",
    status: getSelect(p["Status"]) || "",
    activePromotion: getCheckbox(p["Active Promotion"]),
    bundleDiscount: getNumber(p["Bundle Discount"]) ?? 0,
    tags: getMultiSelect(p["Tags"]),
    productIds: getRelationIds(p["Products"] || p["Formulas"]),
    fragranceOilIds: getRelationIds(p["Fragrance Oils"]),
    launchDate: getRichText(p["Launch Date"]),
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
    const pages = await queryAllPages(NOTION_DATABASE_IDS.collections, {
      sorts: [{ property: "Collection Name", direction: "ascending" }],
    })

    const collections = pages.map(mapCollectionPage)

    return NextResponse.json({
      collections,
      total: collections.length,
      syncedAt: new Date().toISOString(),
      database: "MNKY Collections",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
