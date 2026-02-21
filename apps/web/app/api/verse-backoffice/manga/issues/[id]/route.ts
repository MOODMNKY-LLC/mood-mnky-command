import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireInternalApiKey } from "@/lib/api/internal-auth"
import { pushMangaIssueMetadataToNotion } from "@/lib/notion"

async function requireMangaAdmin(request: NextRequest): Promise<boolean> {
  if (requireInternalApiKey(request)) return true
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.rpc("is_admin")
  return data === true
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireMangaAdmin(request))) {
    return NextResponse.json(
      { error: "Unauthorized. Use MOODMNKY_API_KEY or admin session." },
      { status: 401 }
    )
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Missing issue id" }, { status: 400 })
  }

  let body: {
    title?: string
    slug?: string
    status?: string
    arc_summary?: string | null
    published_at?: string | null
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (body.status !== undefined && body.status !== "draft" && body.status !== "published") {
    return NextResponse.json(
      { error: "status must be 'draft' or 'published'" },
      { status: 400 }
    )
  }

  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.title = body.title
  if (body.slug !== undefined) updates.slug = body.slug
  if (body.status !== undefined) updates.status = body.status
  if (body.arc_summary !== undefined) updates.arc_summary = body.arc_summary
  if (body.published_at !== undefined) updates.published_at = body.published_at || null

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: issue, error: updateError } = await supabase
    .from("mnky_issues")
    .update(updates)
    .eq("id", id)
    .select("id, notion_id, title, slug, status, arc_summary, published_at, collection_id")
    .single()

  if (updateError) {
    if (updateError.code === "23505") {
      return NextResponse.json(
        { error: "Slug already in use by another issue." },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: updateError.message ?? "Update failed" },
      { status: 400 }
    )
  }

  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 })
  }

  if (issue.notion_id) {
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
    } catch {
      // Log but do not fail the PATCH; Supabase is updated
    }
  }

  return NextResponse.json(issue)
}
