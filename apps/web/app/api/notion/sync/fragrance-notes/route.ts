import { NextRequest, NextResponse } from "next/server"
import {
  queryAllPages,
  NOTION_DATABASE_IDS,
  isConfigured,
  getTitle,
  getRichText,
  createPageInDatabase,
  updatePageProperties,
  richTextChunks,
} from "@/lib/notion"
import type { NotionPage } from "@/lib/notion"
import { createAdminClient } from "@/lib/supabase/admin"

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function mapFragranceNotePage(page: NotionPage) {
  const p = page.properties
  const name = getTitle(p["Name"])
  const slugFromNotion = getRichText(p["Slug"])?.trim()
  return {
    name,
    slug: slugFromNotion && slugFromNotion.length > 0 ? slugFromNotion : slugify(name),
    descriptionShort: getRichText(p["Description Short"]) ?? "",
    olfactiveProfile: getRichText(p["Olfactive Profile"]) ?? "",
    facts: getRichText(p["Facts"]) ?? "",
  }
}

function toDbRow(item: ReturnType<typeof mapFragranceNotePage>) {
  const now = new Date().toISOString()
  return {
    name: item.name,
    slug: item.slug,
    description_short: item.descriptionShort,
    olfactive_profile: item.olfactiveProfile,
    facts: item.facts,
    updated_at: now,
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
    const pages = await queryAllPages(NOTION_DATABASE_IDS.fragranceNotes)
    const notes = pages.map(mapFragranceNotePage)

    return NextResponse.json({
      notes,
      total: notes.length,
      syncedAt: new Date().toISOString(),
      database: "MNKY Note Glossary",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** Notion API allows ~3 requests/sec; we throttle to ~2/sec to avoid 429 */
const NOTION_RATE_LIMIT_MS = 500

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Sync Supabase fragrance_notes → Notion MNKY Note Glossary with rate limiting */
async function syncSupabaseToNotion(supabase: ReturnType<typeof createAdminClient>) {
  const { data: notes, error: fetchError } = await supabase
    .from("fragrance_notes")
    .select("id, name, slug, description_short, olfactive_profile, facts")
    .order("name")

  if (fetchError) throw new Error(fetchError.message)
  if (!notes?.length) return { created: 0, updated: 0 }

  const existingPages = await queryAllPages(NOTION_DATABASE_IDS.fragranceNotes)
  await sleep(NOTION_RATE_LIMIT_MS)
  const slugToPageId = new Map<string, string>()
  for (const p of existingPages) {
    const name = getTitle(p.properties["Name"])
    const slugFromNotion = getRichText(p.properties["Slug"])?.trim()
    const slug = slugFromNotion && slugFromNotion.length > 0 ? slugFromNotion : slugify(name)
    slugToPageId.set(slug, p.id)
  }

  let created = 0
  let updated = 0
  const dbId = NOTION_DATABASE_IDS.fragranceNotes

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]
    const slug = note.slug || slugify(note.name)
    if (!slug) continue

    const toRichText = (s: string) => {
      const chunks = richTextChunks(s ?? "")
      return chunks.length > 0 ? chunks : [{ text: { content: "" } }]
    }
    const props: Record<string, unknown> = {
      Name: { title: [{ text: { content: note.name || "Untitled" } }] },
      Slug: { rich_text: toRichText(slug) },
      "Description Short": { rich_text: toRichText(note.description_short ?? "") },
      "Olfactive Profile": { rich_text: toRichText(note.olfactive_profile ?? "") },
      Facts: { rich_text: toRichText(note.facts ?? "") },
    }

    const pageId = slugToPageId.get(slug)
    if (pageId) {
      await updatePageProperties(pageId, props)
      updated++
    } else {
      await createPageInDatabase(dbId, props)
      created++
    }
    await sleep(NOTION_RATE_LIMIT_MS)
  }

  return { created, updated }
}

export async function POST(request: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Notion is not configured. Add NOTION_API_KEY environment variable." },
      { status: 503 }
    )
  }

  const supabase = createAdminClient()
  let body: { direction?: string } = {}
  try {
    body = await request.json().catch(() => ({}))
  } catch {
    // no body
  }
  const direction = (body.direction ?? "to-supabase").toLowerCase()

  try {
    if (direction === "to-notion" || direction === "from-supabase") {
      const { created, updated } = await syncSupabaseToNotion(supabase)
      try {
        await supabase.from("sync_logs").insert({
          source: "notion",
          entity_type: "fragrance_notes",
          records_synced: created + updated,
          status: "success",
        })
      } catch {
        // ignore
      }
      return NextResponse.json({
        success: true,
        direction: "supabase-to-notion",
        created,
        updated,
        total: created + updated,
        syncedAt: new Date().toISOString(),
        database: "MNKY Note Glossary",
      })
    }

    // Default: Notion → Supabase
    const pages = await queryAllPages(NOTION_DATABASE_IDS.fragranceNotes)
    const mapped = pages.map(mapFragranceNotePage)
    const rows = mapped.map(toDbRow).filter((r) => r.slug.length > 0)

    const { data: upserted, error: upsertError } = await supabase
      .from("fragrance_notes")
      .upsert(rows, {
        onConflict: "slug",
        ignoreDuplicates: false,
      })
      .select("id")

    if (upsertError) {
      throw new Error(upsertError.message)
    }

    const recordsSynced = upserted?.length ?? rows.length

    try {
      await supabase.from("sync_logs").insert({
        source: "notion",
        entity_type: "fragrance_notes",
        records_synced: recordsSynced,
        status: "success",
      })
    } catch {
      // sync_logs may not exist or have different schema; ignore
    }

    return NextResponse.json({
      success: true,
      direction: "notion-to-supabase",
      recordsSynced,
      total: rows.length,
      syncedAt: new Date().toISOString(),
      database: "MNKY Note Glossary",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"

    try {
      await supabase.from("sync_logs").insert({
        source: "notion",
        entity_type: "fragrance_notes",
        records_synced: 0,
        status: "error",
        error_message: message,
      })
    } catch {
      // ignore
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
