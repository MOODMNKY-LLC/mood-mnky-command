import { NextResponse } from "next/server"
import {
  getDatabaseInfo,
  NOTION_DATABASE_IDS,
  isConfigured,
} from "@/lib/notion"

export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json(
      {
        error:
          "Notion is not configured. Add NOTION_API_KEY environment variable.",
      },
      { status: 503 }
    )
  }

  try {
    const [fragranceOils, formulas, collections] = await Promise.all([
      getDatabaseInfo(NOTION_DATABASE_IDS.fragranceOils).catch((e) => ({
        id: NOTION_DATABASE_IDS.fragranceOils,
        title: "MNKY Science Fragrance Oils",
        url: "",
        propertyCount: 0,
        lastEditedTime: "",
        error: e instanceof Error ? e.message : "Failed to fetch",
      })),
      getDatabaseInfo(NOTION_DATABASE_IDS.formulas).catch((e) => ({
        id: NOTION_DATABASE_IDS.formulas,
        title: "MNKY Formulas",
        url: "",
        propertyCount: 0,
        lastEditedTime: "",
        error: e instanceof Error ? e.message : "Failed to fetch",
      })),
      getDatabaseInfo(NOTION_DATABASE_IDS.collections).catch((e) => ({
        id: NOTION_DATABASE_IDS.collections,
        title: "MNKY Collections",
        url: "",
        propertyCount: 0,
        lastEditedTime: "",
        error: e instanceof Error ? e.message : "Failed to fetch",
      })),
    ])

    return NextResponse.json({
      databases: [
        { ...fragranceOils, key: "fragranceOils" },
        { ...formulas, key: "formulas" },
        { ...collections, key: "collections" },
      ],
      configured: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
