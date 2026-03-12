import { NextRequest, NextResponse } from "next/server"
import { getDocBySlug, getDocSlugs, slugToTitle } from "@/lib/docs"
import type { DocCategory } from "@/lib/docs"

const VALID_CATEGORIES: DocCategory[] = ["admin", "guide"]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category") as DocCategory | null
  const slug = searchParams.get("slug")

  if (!category || !VALID_CATEGORIES.includes(category)) {
    const adminSlugs = getDocSlugs("admin")
    const guideSlugs = getDocSlugs("guide")
    return NextResponse.json({
      adminSlugs: adminSlugs.map((s) => ({
        slug: s,
        title: (getDocBySlug(s, "admin")?.meta?.title as string) ?? slugToTitle(s),
      })),
      guideSlugs: guideSlugs.map((s) => ({
        slug: s,
        title: (getDocBySlug(s, "guide")?.meta?.title as string) ?? slugToTitle(s),
      })),
    })
  }

  if (!slug) {
    const slugs = getDocSlugs(category)
    return NextResponse.json({
      slugs: slugs.map((s) => ({
        slug: s,
        title: (getDocBySlug(s, category)?.meta?.title as string) ?? slugToTitle(s),
      })),
    })
  }

  const doc = getDocBySlug(slug, category)
  if (!doc) {
    return NextResponse.json({ error: "Doc not found" }, { status: 404 })
  }

  return NextResponse.json({
    content: doc.content,
    meta: doc.meta,
    slug: doc.slug,
  })
}
