import { NextResponse } from "next/server"
import {
  queryAllPages,
  NOTION_DATABASE_IDS,
  isConfigured,
  getTitle,
  getRichText,
  getSelect,
  getDate,
  getUrl,
  getNumber,
} from "@/lib/notion"
import type { NotionPage } from "@/lib/notion"
import { fetchPageBlocksToMarkdown } from "@/lib/notion-blocks"
import { createAdminClient } from "@/lib/supabase/admin"

const NOTION_RATE_LIMIT_MS = 500

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/** Normalize Notion Author/Agent select (e.g. "MOOD MNKY") to slug (e.g. "mood_mnky"). */
function normalizeAuthorAgent(value: string | null): string | null {
  if (!value?.trim()) return null
  const slug = value.toLowerCase().trim().replace(/\s+/g, "_")
  return ["mood_mnky", "sage_mnky", "code_mnky"].includes(slug) ? slug : null
}

/** Resolve cover URL from page properties. Notion API may key the property as "Cover URL" or "cover_url"; fallback to first url-type property. */
function getCoverUrlFromPage(properties: NotionPage["properties"]): string | null {
  const cover =
    getUrl(properties["Cover URL"]) ??
    getUrl(properties["cover_url"]) ??
    null
  if (cover) return cover
  for (const key of Object.keys(properties)) {
    const prop = properties[key]
    if (prop?.type === "url" && prop.url) return prop.url
  }
  return null
}

function mapBlogPage(page: NotionPage) {
  const p = page.properties
  const title = getTitle(p["Title"])
  const slugFromNotion = getRichText(p["Slug"])?.trim()
  const slug = slugFromNotion && slugFromNotion.length > 0 ? slugFromNotion : slugify(title)
  const statusRaw = getSelect(p["Status"])?.toLowerCase()
  const status = statusRaw === "published" || statusRaw === "draft" ? statusRaw : "draft"
  const authorSelect =
    getSelect(p["Author"]) ?? getSelect(p["Agent"]) ?? null
  const authorAgent = normalizeAuthorAgent(authorSelect)
  return {
    notionId: page.id,
    title: title || "Untitled",
    slug,
    excerpt: getRichText(p["Excerpt"]) ?? "",
    status,
    publishedAt: getDate(p["Published Date"]) ?? null,
    coverUrl: getCoverUrlFromPage(p),
    authorAgent,
    sortOrder: getNumber(p["Order"]) ?? 0,
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
    const pages = await queryAllPages(NOTION_DATABASE_IDS.blog)
    const posts = pages.map(mapBlogPage).filter((p) => p.slug.length > 0)

    return NextResponse.json({
      posts,
      total: posts.length,
      syncedAt: new Date().toISOString(),
      database: "MNKY VERSE Blog",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST() {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Notion is not configured. Add NOTION_API_KEY environment variable." },
      { status: 503 }
    )
  }

  const supabase = createAdminClient()

  try {
    const pages = await queryAllPages(NOTION_DATABASE_IDS.blog)
    let synced = 0

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const meta = mapBlogPage(page)
      if (!meta.slug) continue

      await sleep(NOTION_RATE_LIMIT_MS)
      const content = await fetchPageBlocksToMarkdown(page.id)

      const row = {
        notion_id: meta.notionId,
        title: meta.title,
        slug: meta.slug,
        excerpt: meta.excerpt,
        content,
        status: meta.status,
        published_at: meta.publishedAt,
        cover_url: meta.coverUrl,
        author_agent: meta.authorAgent,
        sort_order: meta.sortOrder,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("verse_blog_posts").upsert(row, {
        onConflict: "notion_id",
        ignoreDuplicates: false,
      })

      if (!error) synced++
    }

    return NextResponse.json({
      success: true,
      direction: "notion-to-supabase",
      recordsSynced: synced,
      total: pages.length,
      syncedAt: new Date().toISOString(),
      database: "MNKY VERSE Blog",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
