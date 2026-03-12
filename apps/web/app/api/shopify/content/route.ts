import { NextResponse } from "next/server"
import { getPages, getPageCount, getBlogs, getBlogArticles, getRedirects, isConfigured } from "@/lib/shopify"

export async function GET(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Shopify is not configured." }, { status: 503 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "all"

    if (type === "pages") {
      const pages = await getPages({ limit: 50 })
      const count = await getPageCount()
      return NextResponse.json({ pages, count })
    }

    if (type === "blogs") {
      const blogs = await getBlogs()
      const blogsWithArticles = await Promise.all(
        blogs.map(async (blog) => {
          const articles = await getBlogArticles(blog.id, { limit: 10 })
          return { ...blog, articles }
        })
      )
      return NextResponse.json({ blogs: blogsWithArticles })
    }

    if (type === "redirects") {
      const redirects = await getRedirects()
      return NextResponse.json({ redirects })
    }

    // Return all content overview
    const [pages, blogs, redirects, pageCount] = await Promise.all([
      getPages({ limit: 10 }),
      getBlogs(),
      getRedirects({ limit: 10 }),
      getPageCount(),
    ])
    return NextResponse.json({ pages, blogs, redirects, pageCount })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
