import { NextRequest, NextResponse } from "next/server"
import path from "node:path"
import fs from "node:fs"
import matter from "gray-matter"
import {
  queryAllPages,
  NOTION_DATABASE_IDS,
  isConfigured,
  getTitle,
  getRichText,
  getSelect,
  getNumber,
  createPageInDatabase,
  updatePageProperties,
  richTextChunks,
} from "@/lib/notion"
import type { NotionPage } from "@/lib/notion"
import { slugToTitle } from "@/lib/docs"

export type DocCategory = "admin" | "guide"

const DOCS_ADMIN_DIR = path.join(process.cwd(), "docs", "admin")
const DOCS_GUIDE_DIR = path.join(process.cwd(), "docs", "guide")

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Slug to filename: cdn-usage-guide → CDN-USAGE-GUIDE.md
 */
function slugToFilename(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.toUpperCase())
    .join("-") + ".md"
}

function getDirForCategory(category: DocCategory): string {
  return category === "admin" ? DOCS_ADMIN_DIR : DOCS_GUIDE_DIR
}

function mapDocPage(page: NotionPage) {
  const p = page.properties
  const title = getTitle(p["Title"])
  const slugFromNotion = getRichText(p["Slug"])?.trim()
  const slug = slugFromNotion && slugFromNotion.length > 0 ? slugFromNotion : slugify(title)
  const categoryRaw = getSelect(p["Category"])
  const category = (categoryRaw === "admin" || categoryRaw === "guide" ? categoryRaw : "guide") as DocCategory
  return {
    title: title || slugToTitle(slug),
    slug,
    category,
    description: getRichText(p["Description"]) ?? "",
    content: getRichText(p["Content"]) ?? "",
    order: getNumber(p["Order"]) ?? 0,
  }
}

/** Notion API allows ~3 requests/sec; we throttle to ~2/sec to avoid 429 */
const NOTION_RATE_LIMIT_MS = 500

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Sync Notion MNKY Command Docs → Files (docs/admin, docs/guide) */
async function syncNotionToFiles(): Promise<{ written: number }> {
  const pages = await queryAllPages(NOTION_DATABASE_IDS.docs)
  const docs = pages.map(mapDocPage).filter((d) => d.slug.length > 0)

  let written = 0
  for (const doc of docs) {
    const dir = getDirForCategory(doc.category)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const filename = slugToFilename(doc.slug)
    const filePath = path.join(dir, filename)
    const frontmatter: Record<string, unknown> = {
      title: doc.title,
      description: doc.description || undefined,
      order: doc.order,
    }
    const yaml = matter.stringify(doc.content, frontmatter, { lineWidth: -1 })
    fs.writeFileSync(filePath, yaml, "utf-8")
    written++
  }
  return { written }
}

/** Sync Files (docs/admin, docs/guide) → Notion MNKY Command Docs */
async function syncFilesToNotion(): Promise<{ created: number; updated: number }> {
  const categories: DocCategory[] = ["admin", "guide"]
  const fileDocs: Array<{ slug: string; category: DocCategory; title: string; description: string; content: string; order: number }> = []

  for (const category of categories) {
    const dir = getDirForCategory(category)
    if (!fs.existsSync(dir)) continue
    const files = fs.readdirSync(dir).filter((f) => /\.(md|mdx)$/i.test(f))
    for (const file of files) {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8")
      const { data, content } = matter(raw)
      const slug = file
        .replace(/\.(md|mdx)$/i, "")
        .toLowerCase()
        .replace(/_/g, "-")
      fileDocs.push({
        slug,
        category,
        title: (data.title as string) ?? slugToTitle(slug),
        description: (data.description as string) ?? "",
        content: content.trim(),
        order: (data.order as number) ?? 0,
      })
    }
  }

  const existingPages = await queryAllPages(NOTION_DATABASE_IDS.docs)
  await sleep(NOTION_RATE_LIMIT_MS)
  const keyToPageId = new Map<string, string>()
  for (const p of existingPages) {
    const slugFromNotion = getRichText(p.properties["Slug"])?.trim()
    const categoryRaw = getSelect(p.properties["Category"])
    const category = (categoryRaw === "admin" || categoryRaw === "guide" ? categoryRaw : "guide") as DocCategory
    const slug = slugFromNotion && slugFromNotion.length > 0 ? slugFromNotion : slugify(getTitle(p.properties["Title"]))
    keyToPageId.set(`${category}:${slug}`, p.id)
  }

  let created = 0
  let updated = 0
  const dbId = NOTION_DATABASE_IDS.docs

  const toRichText = (s: string) => {
    const chunks = richTextChunks(s ?? "")
    return chunks.length > 0 ? chunks : [{ text: { content: "" } }]
  }

  for (let i = 0; i < fileDocs.length; i++) {
    const doc = fileDocs[i]
    const key = `${doc.category}:${doc.slug}`

    const props: Record<string, unknown> = {
      Title: { title: [{ text: { content: doc.title || "Untitled" } }] },
      Slug: { rich_text: toRichText(doc.slug) },
      Category: { select: { name: doc.category } },
      Description: { rich_text: toRichText(doc.description ?? "") },
      Content: { rich_text: toRichText(doc.content ?? "") },
      Order: { number: doc.order },
      Status: { select: { name: "Published" } },
    }

    const pageId = keyToPageId.get(key)
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

export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Notion is not configured. Add NOTION_API_KEY environment variable." },
      { status: 503 }
    )
  }

  try {
    const pages = await queryAllPages(NOTION_DATABASE_IDS.docs)
    const docs = pages.map(mapDocPage)

    return NextResponse.json({
      docs,
      total: docs.length,
      syncedAt: new Date().toISOString(),
      database: "MNKY Command Docs",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Notion is not configured. Add NOTION_API_KEY environment variable." },
      { status: 503 }
    )
  }

  let body: { direction?: string } = {}
  try {
    body = await request.json().catch(() => ({}))
  } catch {
    // no body
  }
  const direction = (body.direction ?? "to-files").toLowerCase()

  try {
    if (direction === "to-notion" || direction === "files-to-notion") {
      const { created, updated } = await syncFilesToNotion()
      return NextResponse.json({
        success: true,
        direction: "files-to-notion",
        created,
        updated,
        total: created + updated,
        syncedAt: new Date().toISOString(),
        database: "MNKY Command Docs",
      })
    }

    // Default: Notion → Files
    const { written } = await syncNotionToFiles()
    return NextResponse.json({
      success: true,
      direction: "notion-to-files",
      written,
      total: written,
      syncedAt: new Date().toISOString(),
      database: "MNKY Command Docs",
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
