import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  isConfigured,
  queryAllPages,
  getTitle,
  getRichText,
} from "@/lib/notion"
import { requireAppAssetsAdmin } from "../require-admin"

const NOTION_APP_ASSETS_DATABASE_ID =
  process.env.NOTION_APP_ASSETS_DATABASE_ID?.replace(/-/g, "") ?? ""

/** POST /api/app-assets/sync-from-notion – pull slot metadata from Notion App Asset Slots database (admin only). */
export async function POST(request: Request) {
  const auth = await requireAppAssetsAdmin(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  if (!isConfigured() || !NOTION_APP_ASSETS_DATABASE_ID) {
    return NextResponse.json(
      {
        error:
          "Notion not configured. Set NOTION_API_KEY and NOTION_APP_ASSETS_DATABASE_ID and share the App Asset Slots database with the integration.",
      },
      { status: 503 }
    )
  }

  const admin = createAdminClient()
  let synced = 0

  try {
    const pages = await queryAllPages(NOTION_APP_ASSETS_DATABASE_ID)

    for (const page of pages) {
      const props = page.properties as Record<string, { type: string; title?: Array<{ plain_text: string }>; rich_text?: Array<{ plain_text: string }>; url?: string; select?: { name: string } }>
      const slotKey =
        getRichText(props["Slot Key"]) ||
        getTitle(props["Name"]) ||
        getTitle(props["Title"]) ||
        ""
      if (!slotKey.trim()) continue

      const label =
        getTitle(props["Label"]) ||
        getTitle(props["Name"]) ||
        getTitle(props["Title"]) ||
        slotKey
      const category =
        props["Category"]?.select?.name ||
        props["category"]?.select?.name ||
        "main-services"
      const routeHint =
        getRichText(props["Route"]) ||
        getRichText(props["Route Hint"]) ||
        null
      const notionPageId = page.id

      const { error } = await admin
        .from("app_asset_slots")
        .upsert(
          {
            slot_key: slotKey.trim(),
            label: label.trim(),
            category: category.trim(),
            route_hint: routeHint?.trim() || null,
            notion_page_id: notionPageId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "slot_key", ignoreDuplicates: false }
        )

      if (error) {
        console.error("[app-assets sync-from-notion]", slotKey, error.message)
      } else {
        synced++
      }
    }

    return NextResponse.json({
      ok: true,
      synced,
      total: pages.length,
      databaseId: NOTION_APP_ASSETS_DATABASE_ID,
    })
  } catch (err) {
    console.error("[POST /api/app-assets/sync-from-notion]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    )
  }
}
