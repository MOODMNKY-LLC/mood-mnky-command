import { NextResponse } from "next/server"
import { requireInternalApiKey } from "@/lib/api/internal-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"

const bodySchema = z.object({ issueSlug: z.string().min(1) })

export async function POST(request: Request) {
  if (!requireInternalApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const { data: issue, error } = await supabase
    .from("mnky_issues")
    .select(
      `
      id, slug, title, status, arc_summary, cover_asset_url,
      mnky_collections ( id, name, slug )
    `
    )
    .eq("slug", parsed.data.issueSlug)
    .single()

  if (error || !issue) {
    return NextResponse.json(
      { error: error?.message ?? "Issue not found" },
      { status: 404 }
    )
  }

  const { data: chapters } = await supabase
    .from("mnky_chapters")
    .select("id, fragrance_name, shopify_product_gid, setting, chapter_order")
    .eq("issue_id", issue.id)
    .order("chapter_order")

  const chapterIds = (chapters ?? []).map((c) => c.id)
  const { data: panels } = chapterIds.length
    ? await supabase
        .from("mnky_panels")
        .select("id, chapter_id, panel_number, script_text, asset_prompt, asset_url")
        .in("chapter_id", chapterIds)
        .order("chapter_id")
        .order("panel_number")
    : { data: [] }

  return NextResponse.json({
    issue,
    chapters: chapters ?? [],
    panels: panels?.data ?? [],
  })
}
