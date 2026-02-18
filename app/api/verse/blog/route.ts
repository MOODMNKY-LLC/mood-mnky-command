/**
 * Public API for MNKY VERSE blog posts.
 * Used by theme app block "Latest from MNKY VERSE" and external consumers.
 * GET /api/verse/blog?limit=3
 * Cache-Control + CORS for storefront embedding.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getBlogCoverUrl } from "@/lib/verse-blog"

const CACHE_MAX_AGE = 300 // 5 minutes
const DEFAULT_LIMIT = 3
const MAX_LIMIT = 10

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawLimit = searchParams.get("limit")
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(rawLimit ?? "", 10) || DEFAULT_LIMIT)
  )

  const supabase = await createClient()
  const { data: posts, error } = await supabase
    .from("verse_blog_posts")
    .select("id, title, slug, excerpt, published_at, cover_url, author_agent")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json(
      { error: "Failed to load blog posts" },
      {
        status: 500,
        headers: corsHeaders(),
      }
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mnky-command.moodmnky.com"
  const items = (posts ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt || "",
    published_at: p.published_at,
    cover_url: getBlogCoverUrl(p.cover_url, p.author_agent),
    url: `${baseUrl}/verse/blog/${p.slug}`,
  }))

  return NextResponse.json(
    { posts: items, total: items.length },
    {
      headers: {
        ...corsHeaders(),
        "Cache-Control": `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=600`,
      },
    }
  )
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Max-Age": "86400",
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  })
}
