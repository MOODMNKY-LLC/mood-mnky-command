import { NextResponse } from "next/server"
import { requireInternalApiKey } from "@/lib/api/internal-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"

const bodySchema = z.object({
  issueSlug: z.string().min(1),
  chapterOrder: z.number().int().min(1).optional(),
})

/**
 * POST /api/flowise/tools/manga/hotspot-mapper
 *
 * Returns issue, chapters, panels, and existing hotspots for the given issue (optionally one chapter).
 * Flowise chatflows can use this context so an LLM can suggest new hotspots. Suggested output shape:
 * { suggestions: [ { chapter_order, panel_number, type, shopify_gid, x, y, label, tooltip } ] }
 * Types: product | variant | collection | bundle. x, y in 0..1.
 */
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
  const { data: issue, error: issueError } = await supabase
    .from("mnky_issues")
    .select(
      `
      id, slug, title, status, arc_summary, cover_asset_url,
      mnky_collections ( id, name, slug )
    `
    )
    .eq("slug", parsed.data.issueSlug)
    .single()

  if (issueError || !issue) {
    return NextResponse.json(
      { error: issueError?.message ?? "Issue not found" },
      { status: 404 }
    )
  }

  let chaptersQuery = supabase
    .from("mnky_chapters")
    .select("id, fragrance_name, shopify_product_gid, setting, chapter_order")
    .eq("issue_id", issue.id)
    .order("chapter_order")

  if (parsed.data.chapterOrder != null) {
    chaptersQuery = chaptersQuery.eq("chapter_order", parsed.data.chapterOrder)
  }

  const { data: chapters } = await chaptersQuery

  const chapterIds = (chapters ?? []).map((c) => c.id)
  const { data: panels } =
    chapterIds.length > 0
      ? await supabase
          .from("mnky_panels")
          .select("id, chapter_id, panel_number, script_text, asset_prompt, asset_url")
          .in("chapter_id", chapterIds)
          .order("chapter_id")
          .order("panel_number")
      : { data: [] }

  const panelIds = (panels?.data ?? []).map((p) => p.id)
  const { data: hotspots } =
    panelIds.length > 0
      ? await supabase
          .from("mnky_hotspots")
          .select("id, panel_id, type, shopify_gid, x, y, label, tooltip")
          .in("panel_id", panelIds)
      : { data: [] }

  const hotspotList = hotspots ?? []
  const panelsWithHotspots = (panels?.data ?? []).map((p) => ({
    ...p,
    existing_hotspots: hotspotList.filter((h) => h.panel_id === p.id),
  }))

  const chapterOrderByChapterId = new Map((chapters ?? []).map((c) => [c.id, c.chapter_order]))

  return NextResponse.json({
    issue,
    chapters: chapters ?? [],
    panels: panelsWithHotspots.map((p) => ({
      ...p,
      chapter_order: chapterOrderByChapterId.get(p.chapter_id) ?? null,
    })),
    output_schema: {
      description:
        "Use this context to suggest shoppable hotspots per panel. Return suggestions array with chapter_order, panel_number, type (product|variant|collection|bundle), shopify_gid, x (0-1), y (0-1), label, tooltip.",
      suggestions: [
        {
          chapter_order: 1,
          panel_number: 1,
          type: "product",
          shopify_gid: "gid://shopify/Product/...",
          x: 0.5,
          y: 0.5,
          label: "Fragrance vessel",
          tooltip: "Add to cart",
        },
      ],
    },
  })
}
