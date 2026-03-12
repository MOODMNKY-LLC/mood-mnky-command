import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/mag/issues/[slug]/box
 * Returns issue + collection + chapters for MNKY BOX editorial view.
 * Only published issues. Chapters include optional card_image_url (first panel asset).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: issue, error: issueError } = await supabase
    .from("mnky_issues")
    .select(`
      id,
      collection_id,
      issue_number,
      title,
      slug,
      status,
      arc_summary,
      cover_asset_url,
      hero_asset_url,
      lore_override,
      accent_primary,
      accent_secondary,
      published_at,
      mnky_collections ( id, name, slug )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (issueError || !issue) {
    return NextResponse.json(
      { error: issueError?.message ?? "Issue not found" },
      { status: issueError?.code === "PGRST116" ? 404 : 500 }
    )
  }

  const { data: chapters, error: chaptersError } = await supabase
    .from("mnky_chapters")
    .select("id, fragrance_name, shopify_product_gid, setting, chapter_order")
    .eq("issue_id", issue.id)
    .order("chapter_order", { ascending: true })

  if (chaptersError) {
    return NextResponse.json(
      { error: "Failed to fetch chapters", details: chaptersError.message },
      { status: 500 }
    )
  }

  const chapterIds = (chapters ?? []).map((c) => c.id)
  const { data: firstPanels } = await supabase
    .from("mnky_panels")
    .select("chapter_id, asset_url")
    .in("chapter_id", chapterIds)
    .eq("panel_number", 1)

  const panelByChapter = new Map(
    (firstPanels ?? []).map((p) => [p.chapter_id, p.asset_url])
  )

  const products = (chapters ?? []).map((ch) => ({
    id: ch.id,
    fragrance_name: ch.fragrance_name,
    shopify_product_gid: ch.shopify_product_gid,
    setting: ch.setting ?? undefined,
    chapter_order: ch.chapter_order,
    card_image_url: panelByChapter.get(ch.id) ?? undefined,
  }))

  return NextResponse.json({
    issue: {
      id: issue.id,
      title: issue.title,
      slug: issue.slug,
      issue_number: issue.issue_number,
      arc_summary: issue.arc_summary,
      cover_asset_url: issue.cover_asset_url,
      hero_asset_url: issue.hero_asset_url ?? issue.cover_asset_url,
      lore_override: issue.lore_override ?? issue.arc_summary,
      accent_primary: issue.accent_primary ?? "#B7F0FF",
      accent_secondary: issue.accent_secondary ?? "#F6D1A7",
    },
    collection: issue.mnky_collections,
    products,
  })
}
