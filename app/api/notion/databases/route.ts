import { NextResponse } from "next/server"
import {
  getDatabaseInfo,
  queryAllPages,
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
    const dbKeys = [
      { key: "fragranceOils", id: NOTION_DATABASE_IDS.fragranceOils, fallbackTitle: "MNKY Science Fragrance Oils" },
      { key: "collections", id: NOTION_DATABASE_IDS.collections, fallbackTitle: "MNKY Collections" },
    ]

    const databases = await Promise.all(
      dbKeys.map(async ({ key, id, fallbackTitle }) => {
        try {
          const [info, pages] = await Promise.all([
            getDatabaseInfo(id),
            queryAllPages(id),
          ])
          return {
            key,
            title: info.title || fallbackTitle,
            url: info.url,
            propertyCount: info.propertyCount,
            recordCount: pages.length,
            lastEditedTime: info.lastEditedTime,
          }
        } catch (e) {
          return {
            key,
            title: fallbackTitle,
            url: "",
            propertyCount: 0,
            recordCount: 0,
            lastEditedTime: "",
            error: e instanceof Error ? e.message : "Failed to fetch",
          }
        }
      })
    )

    const totalRecords = databases.reduce((acc, db) => acc + db.recordCount, 0)

    return NextResponse.json({
      databases,
      totalRecords,
      configured: true,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
