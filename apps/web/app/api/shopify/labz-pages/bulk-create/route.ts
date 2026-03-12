import { NextResponse } from "next/server"
import { pageCreate, isShopifyGraphQLConfigured } from "@/lib/shopify-admin-graphql"

/** LABZ pages to create in bulk: landing + five content pages (Fragrance Wheel, Blending Lab, Glossary, Formulas, Fragrance Oils). */
const LABZ_PAGES_SPEC: Array<{ title: string; handle: string; templateSuffix: string }> = [
  { title: "MOOD LABZ", handle: "labz", templateSuffix: "labz-landing" },
  { title: "Fragrance Wheel", handle: "fragrance-wheel", templateSuffix: "fragrance-wheel" },
  { title: "Blending Lab", handle: "blending-guide", templateSuffix: "blending-guide" },
  { title: "Glossary", handle: "glossary", templateSuffix: "glossary" },
  { title: "Formulas", handle: "formulas", templateSuffix: "formulas" },
  { title: "Fragrance Oils", handle: "fragrance-oils", templateSuffix: "fragrance-oils" },
]

export interface BulkCreateResultItem {
  title: string
  handle: string
  templateSuffix: string
  success: boolean
  id?: string
  error?: string
}

/**
 * POST /api/shopify/labz-pages/bulk-create
 * Creates all MOOD LABZ pages (landing + five content pages) in Shopify.
 * Requires SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN.
 * Returns per-page success/error; pages that already exist may return an error from Shopify.
 */
export async function POST() {
  if (!isShopifyGraphQLConfigured()) {
    return NextResponse.json(
      { error: "Shopify is not configured. Add SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN." },
      { status: 503 }
    )
  }

  const results: BulkCreateResultItem[] = []

  for (const spec of LABZ_PAGES_SPEC) {
    try {
      const page = await pageCreate({
        title: spec.title,
        handle: spec.handle,
        templateSuffix: spec.templateSuffix,
        isPublished: true,
      })
      results.push({
        title: spec.title,
        handle: spec.handle,
        templateSuffix: spec.templateSuffix,
        success: true,
        id: page.id,
      })
    } catch (err) {
      results.push({
        title: spec.title,
        handle: spec.handle,
        templateSuffix: spec.templateSuffix,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  const created = results.filter((r) => r.success).length
  return NextResponse.json({
    created,
    total: LABZ_PAGES_SPEC.length,
    results,
  })
}
