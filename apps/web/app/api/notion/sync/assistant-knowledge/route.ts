import { NextRequest, NextResponse } from "next/server"
import {
  retrievePage,
  isConfigured,
  getTitle,
} from "@/lib/notion"
import { fetchPageBlocksToMarkdown } from "@/lib/notion-blocks"
import { createAdminClient } from "@/lib/supabase/admin"

const NOTION_RATE_LIMIT_MS = 500

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type AssistantSource = "faq" | "about" | "shipping" | "policies" | "general"

export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Notion is not configured. Add NOTION_API_KEY." },
      { status: 503 }
    )
  }

  const pageIdsEnv = process.env.NOTION_ASSISTANT_PAGE_IDS ?? ""
  const pageIds = pageIdsEnv
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)

  if (pageIds.length === 0) {
    return NextResponse.json({
      pages: [],
      total: 0,
      message: "Set NOTION_ASSISTANT_PAGE_IDS (comma-separated page IDs) to sync.",
      syncedAt: new Date().toISOString(),
    })
  }

  try {
    const pages: Array<{ pageId: string; title: string }> = []
    for (const pageId of pageIds) {
      const page = await retrievePage(pageId)
      if (page) {
        pages.push({ pageId, title: getTitle(page.properties["Title"]) || "Untitled" })
      }
      await sleep(200)
    }

    return NextResponse.json({
      pages,
      total: pages.length,
      syncedAt: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Notion is not configured. Add NOTION_API_KEY." },
      { status: 503 }
    )
  }

  let body: { pages?: Array<{ pageId: string; source?: AssistantSource }> } = {}
  try {
    body = await request.json().catch(() => ({}))
  } catch {
    /* no body */
  }

  const pageIdsEnv = process.env.NOTION_ASSISTANT_PAGE_IDS ?? ""
  const configPages =
    body.pages && body.pages.length > 0
      ? body.pages
      : pageIdsEnv
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
          .map((pageId) => ({ pageId, source: "general" as AssistantSource }))

  if (configPages.length === 0) {
    return NextResponse.json({
      success: false,
      error: "No pages to sync. Set NOTION_ASSISTANT_PAGE_IDS or pass { pages: [{ pageId, source? }] }.",
      recordsSynced: 0,
    })
  }

  const supabase = createAdminClient()
  let synced = 0

  try {
    for (const { pageId, source = "general" } of configPages) {
      await sleep(NOTION_RATE_LIMIT_MS)
      const page = await retrievePage(pageId)
      if (!page) continue

      await sleep(NOTION_RATE_LIMIT_MS)
      const content = await fetchPageBlocksToMarkdown(pageId)
      const title = getTitle(page.properties["Title"]) || "Untitled"

      const validSource: AssistantSource =
        ["faq", "about", "shipping", "policies", "general"].includes(source)
          ? (source as AssistantSource)
          : "general"

      const row = {
        notion_id: page.id,
        title,
        content: content || "",
        source: validSource,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("assistant_knowledge").upsert(row, {
        onConflict: "notion_id",
        ignoreDuplicates: false,
      })

      if (!error) synced++
    }

    return NextResponse.json({
      success: true,
      recordsSynced: synced,
      total: configPages.length,
      syncedAt: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message, recordsSynced: synced }, { status: 500 })
  }
}
