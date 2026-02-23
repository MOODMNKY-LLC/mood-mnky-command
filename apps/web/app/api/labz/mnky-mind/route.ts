import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  isConfigured,
  queryAllPages,
  getTitle,
  NOTION_MNKY_MIND_DATABASE_ID,
} from "@/lib/notion"
import { fetchPageBlocksToMarkdown } from "@/lib/notion-blocks"

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401 }
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single()
  const isAdmin = profile?.role === "admin" || profile?.is_admin === true
  if (!isAdmin) return { ok: false as const, status: 403 }
  return { ok: true as const }
}

/** GET /api/labz/mnky-mind – list MNKY MIND entries from Supabase (authenticated). */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("mnky_mind_entries")
    .select("id, notion_page_id, notion_database_id, title, category, content_markdown, content_code, source, synced_at, created_at, updated_at")
    .order("synced_at", { ascending: false })

  if (error) {
    console.error("[GET /api/labz/mnky-mind]", error)
    return NextResponse.json(
      { error: "Failed to load MNKY MIND entries" },
      { status: 500 },
    )
  }

  return NextResponse.json(data ?? [])
}

const NOTION_RATE_LIMIT_MS = 500
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** POST /api/labz/mnky-mind – sync from Notion into Supabase (admin only). Two-way: reads Notion DB and upserts mnky_mind_entries. */
export async function POST() {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status })
  }

  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Notion not configured. Set NOTION_API_KEY and share the MNKY_MIND database with the integration." },
      { status: 503 },
    )
  }

  const admin = createAdminClient()
  let synced = 0

  try {
    const pages = await queryAllPages(NOTION_MNKY_MIND_DATABASE_ID)

    for (const page of pages) {
      await sleep(NOTION_RATE_LIMIT_MS)
      const titleProp = Object.values(page.properties).find((p) => p.type === "title")
      const title = getTitle(titleProp) || "Untitled"

      const contentMarkdown = await fetchPageBlocksToMarkdown(page.id)
      await sleep(NOTION_RATE_LIMIT_MS)

      const row = {
        notion_page_id: page.id,
        notion_database_id: NOTION_MNKY_MIND_DATABASE_ID,
        title,
        category: "infra",
        content_markdown: contentMarkdown || null,
        content_code: null,
        source: "notion",
        synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error } = await admin.from("mnky_mind_entries").upsert(row, {
        onConflict: "notion_page_id",
        ignoreDuplicates: false,
      })

      if (error) {
        console.error(`[mnky-mind sync] ${title}:`, error.message)
      } else {
        synced++
      }
    }

    return NextResponse.json({
      ok: true,
      synced,
      total: pages.length,
      databaseId: NOTION_MNKY_MIND_DATABASE_ID,
    })
  } catch (err) {
    console.error("[POST /api/labz/mnky-mind]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    )
  }
}
