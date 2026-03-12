import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireInternalApiKey } from "@/lib/api/internal-auth"
import {
  pushMangaIssueMetadataToNotion,
  pushMangaCollectionToNotion,
} from "@/lib/notion"

async function requireMangaAdmin(request: NextRequest): Promise<boolean> {
  if (requireInternalApiKey(request)) return true
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.rpc("is_admin")
  return data === true
}

export async function POST(request: NextRequest) {
  if (!(await requireMangaAdmin(request))) {
    return NextResponse.json(
      { error: "Unauthorized. Use MOODMNKY_API_KEY or admin session." },
      { status: 401 }
    )
  }

  let body: { type?: string; id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { type, id } = body
  if (type !== "issue" && type !== "collection") {
    return NextResponse.json(
      { error: "Missing or invalid type. Use 'issue' or 'collection'." },
      { status: 400 }
    )
  }
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing or invalid id (Supabase row UUID)." }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (type === "collection") {
    const { data: row, error } = await supabase
      .from("mnky_collections")
      .select("notion_id, name, slug")
      .eq("id", id)
      .single()

    if (error || !row) {
      return NextResponse.json({ error: "Collection not found." }, { status: 404 })
    }
    if (!row.notion_id) {
      return NextResponse.json(
        { error: "Collection has no notion_id; sync from Notion first." },
        { status: 400 }
      )
    }

    try {
      await pushMangaCollectionToNotion(row.notion_id, row.name, row.slug ?? "")
      return NextResponse.json({ ok: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Notion push failed"
      return NextResponse.json({ error: message }, { status: 502 })
    }
  }

  // type === "issue"
  const { data: issue, error: issueError } = await supabase
    .from("mnky_issues")
    .select("notion_id, title, slug, status, arc_summary, published_at, collection_id")
    .eq("id", id)
    .single()

  if (issueError || !issue) {
    return NextResponse.json({ error: "Issue not found." }, { status: 404 })
  }
  if (!issue.notion_id) {
    return NextResponse.json(
      { error: "Issue has no notion_id; sync from Notion first." },
      { status: 400 }
    )
  }

  let collection_notion_id: string | null = null
  if (issue.collection_id) {
    const { data: col } = await supabase
      .from("mnky_collections")
      .select("notion_id")
      .eq("id", issue.collection_id)
      .single()
    collection_notion_id = col?.notion_id ?? null
  }

  try {
    await pushMangaIssueMetadataToNotion(issue.notion_id, {
      title: issue.title,
      slug: issue.slug,
      status: (issue.status === "published" ? "published" : "draft") as "draft" | "published",
      arc_summary: issue.arc_summary ?? null,
      published_at: issue.published_at ? String(issue.published_at) : null,
      collection_notion_id: collection_notion_id ?? undefined,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Notion push failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
