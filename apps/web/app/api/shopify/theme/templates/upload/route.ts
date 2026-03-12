import { NextRequest, NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import {
  themesList,
  themeFileUpsert,
  isShopifyGraphQLConfigured,
} from "@/lib/shopify-admin-graphql"

/** Known page templates in repo (Shopify/theme/templates/) that can be read from disk when content not provided. */
const REPO_TEMPLATE_SUFFIXES = [
  "fragrance-wheel",
  "blending-guide",
  "glossary",
  "formulas",
  "fragrance-oils",
  "labz-landing",
  "glossary-native",
  "empty",
  "about-us",
  "contact",
  "discord-embed",
]

/**
 * POST /api/shopify/theme/templates/upload
 * Body: { suffix: string, content?: string }
 * Uploads templates/page.{suffix}.json to the main theme. If content is omitted and suffix is a known repo template, reads from Shopify/theme/templates/page.{suffix}.json.
 * Requires write_themes scope.
 */
export async function POST(request: NextRequest) {
  if (!isShopifyGraphQLConfigured()) {
    return NextResponse.json(
      { error: "Shopify is not configured. Add SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN." },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { suffix, content: bodyContent } = body as { suffix?: string; content?: string }

    if (!suffix || typeof suffix !== "string" || suffix.trim() === "") {
      return NextResponse.json(
        { error: "suffix is required and must be a non-empty string." },
        { status: 400 }
      )
    }

    const safeSuffix = suffix.trim().replace(/[^a-z0-9-]/gi, "-")
    const filename = `templates/page.${safeSuffix}.json`

    let content: string
    if (bodyContent != null && typeof bodyContent === "string") {
      content = bodyContent
    } else if (REPO_TEMPLATE_SUFFIXES.includes(safeSuffix)) {
      try {
        const path = join(process.cwd(), "Shopify", "theme", "templates", `page.${safeSuffix}.json`)
        content = await readFile(path, "utf-8")
      } catch (e) {
        return NextResponse.json(
          { error: `Could not read repo template page.${safeSuffix}.json: ${e instanceof Error ? e.message : "file not found"}. Provide content in the request body.` },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: "content is required when suffix is not a known repo template. Known: " + REPO_TEMPLATE_SUFFIXES.join(", ") },
        { status: 400 }
      )
    }

    const themes = await themesList(["MAIN"])
    const mainTheme = themes[0]
    if (!mainTheme) {
      return NextResponse.json(
        { error: "No main theme found." },
        { status: 404 }
      )
    }

    const result = await themeFileUpsert(mainTheme.id, filename, content)
    return NextResponse.json({
      success: true,
      filename: result.filename,
      size: result.size,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
