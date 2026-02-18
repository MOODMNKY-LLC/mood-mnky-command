import { NextResponse } from "next/server"
import {
  themesList,
  themeGetPageTemplateSuffixes,
  isShopifyGraphQLConfigured,
} from "@/lib/shopify-admin-graphql"

/**
 * GET /api/shopify/theme/templates
 * Returns the main theme id/name and list of page template suffixes (e.g. fragrance-wheel, empty).
 * Requires read_themes scope.
 */
export async function GET() {
  if (!isShopifyGraphQLConfigured()) {
    return NextResponse.json(
      { error: "Shopify is not configured. Add SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN." },
      { status: 503 }
    )
  }

  try {
    const themes = await themesList(["MAIN"])
    const mainTheme = themes[0]
    if (!mainTheme) {
      return NextResponse.json(
        { error: "No main theme found." },
        { status: 404 }
      )
    }

    const suffixes = await themeGetPageTemplateSuffixes(mainTheme.id)
    return NextResponse.json({
      themeId: mainTheme.id,
      themeName: mainTheme.name,
      suffixes,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
