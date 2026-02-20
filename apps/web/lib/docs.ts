import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

export type DocCategory = "admin" | "guide"

const DOCS_ADMIN_DIR = path.join(process.cwd(), "docs", "admin")
const DOCS_GUIDE_DIR = path.join(process.cwd(), "docs", "guide")

/**
 * Derive slug from filename: CDN-USAGE-GUIDE.md → cdn-usage-guide
 */
function filenameToSlug(filename: string): string {
  return filename
    .replace(/\.(md|mdx)$/i, "")
    .toLowerCase()
    .replace(/_/g, "-")
}

/**
 * Derive display title from slug: cdn-usage-guide → CDN Usage Guide
 */
export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function getDirForCategory(category: DocCategory): string {
  return category === "admin" ? DOCS_ADMIN_DIR : DOCS_GUIDE_DIR
}

/**
 * Get all doc slugs for a category. Returns empty array if dir does not exist.
 */
export function getDocSlugs(category: DocCategory): string[] {
  const dir = getDirForCategory(category)
  if (!fs.existsSync(dir)) return []
  const files = fs.readdirSync(dir)
  const slugs = files
    .filter((f) => /\.(md|mdx)$/i.test(f))
    .map((f) => filenameToSlug(f))
  return slugs.sort()
}

/**
 * Find filename for a slug in a category (case-insensitive match)
 */
function findFilenameForSlug(slug: string, category: DocCategory): string | null {
  const dir = getDirForCategory(category)
  if (!fs.existsSync(dir)) return null
  const files = fs.readdirSync(dir)
  const slugLower = slug.toLowerCase()
  return (
    files.find((f) => {
      if (!/\.(md|mdx)$/i.test(f)) return false
      return filenameToSlug(f) === slugLower
    }) ?? null
  )
}

export interface DocMeta {
  title?: string
  description?: string
  [key: string]: unknown
}

export interface DocResult {
  content: string
  meta: DocMeta
  slug: string
}

/**
 * Load doc by slug and category. Returns content (without frontmatter) and meta.
 */
export function getDocBySlug(
  slug: string,
  category: DocCategory
): DocResult | null {
  const filename = findFilenameForSlug(slug, category)
  if (!filename) return null

  const dir = getDirForCategory(category)
  const filePath = path.join(dir, filename)
  const raw = fs.readFileSync(filePath, "utf-8")
  const { data, content } = matter(raw)

  const title = (data.title as string) ?? slugToTitle(slug)

  return {
    content,
    meta: { ...data, title },
    slug,
  }
}
