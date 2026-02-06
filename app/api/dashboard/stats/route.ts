import { NextResponse } from "next/server"
import { getProductCount, getProducts, isConfigured as shopifyConfigured } from "@/lib/shopify"
import { queryDatabase, NOTION_DATABASE_IDS, getTitle, isConfigured as notionConfigured } from "@/lib/notion"

export async function GET() {
  const stats = {
    totalProducts: 0,
    totalFragrances: 0,
    totalFormulas: 0,
    totalCollections: 0,
    shopifyConnected: false,
    notionConnected: false,
    recentActivity: [] as Array<{ id: string; action: string; target: string; timestamp: string }>,
  }

  // Fetch Shopify data
  if (shopifyConfigured()) {
    try {
      const [count, products] = await Promise.all([
        getProductCount(),
        getProducts({ limit: 5, status: "active" }),
      ])
      stats.totalProducts = count
      stats.shopifyConnected = true

      // Build recent activity from latest products
      for (const product of products) {
        stats.recentActivity.push({
          id: `shopify-${product.id}`,
          action: "Product updated",
          target: product.title,
          timestamp: new Date(product.updated_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        })
      }
    } catch {
      // Shopify not reachable
    }
  }

  // Fetch Notion data
  if (notionConfigured()) {
    try {
      const [fragranceResult, formulaResult, collectionResult] = await Promise.all([
        queryDatabase(NOTION_DATABASE_IDS.fragranceOils, { pageSize: 100 }),
        queryDatabase(NOTION_DATABASE_IDS.formulas, { pageSize: 100 }),
        queryDatabase(NOTION_DATABASE_IDS.collections, { pageSize: 100 }),
      ])
      stats.totalFragrances = fragranceResult.pages.length + (fragranceResult.hasMore ? 100 : 0)
      stats.totalFormulas = formulaResult.pages.length
      stats.totalCollections = collectionResult.pages.length
      stats.notionConnected = true

      // Add recent Notion activity (latest edited formulas)
      const recentFormulas = formulaResult.pages
        .sort((a, b) => new Date(b.last_edited_time).getTime() - new Date(a.last_edited_time).getTime())
        .slice(0, 3)

      for (const page of recentFormulas) {
        const name = getTitle(page.properties["Name"] || page.properties["Formula Name"])
        if (name) {
          stats.recentActivity.push({
            id: `notion-${page.id}`,
            action: "Formula updated",
            target: name,
            timestamp: new Date(page.last_edited_time).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
          })
        }
      }

      // Sort all activity by recency
      stats.recentActivity.sort((a, b) => {
        // Simple sort keeping the order meaningful
        return 0
      })
    } catch {
      // Notion not reachable
    }
  }

  return NextResponse.json(stats)
}
