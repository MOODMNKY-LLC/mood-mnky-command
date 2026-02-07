import { NextResponse } from "next/server"
import { getProductCount, getProducts, getAllCollections, isConfigured as shopifyConfigured } from "@/lib/shopify"
import { queryAllPages, NOTION_DATABASE_IDS, getTitle, isConfigured as notionConfigured } from "@/lib/notion"
import { createClient } from "@/lib/supabase/server"

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
      const [count, products, collections] = await Promise.all([
        getProductCount(),
        getProducts({ limit: 5, status: "active" }),
        getAllCollections(),
      ])
      stats.totalProducts = count
      stats.totalCollections = collections.length
      stats.shopifyConnected = true

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

  // Fetch formulas count from database (Whole Elise formulas)
  try {
    const supabase = await createClient()
    const { count } = await supabase.from("formulas").select("*", { count: "exact", head: true })
    stats.totalFormulas = count ?? 0
  } catch {
    // DB not reachable
  }

  // Fetch Notion data -- fragrances and formulas no longer from Notion
  if (notionConfigured()) {
    try {
      const fragrancePages = await queryAllPages(NOTION_DATABASE_IDS.fragranceOils)
      stats.totalFragrances = fragrancePages.length
      stats.notionConnected = true

      // Add recent Notion activity (latest edited fragrance oils)
      const allPages = fragrancePages.map((p) => ({ ...p, source: "Fragrance" as const }))
        .sort((a, b) => new Date(b.last_edited_time).getTime() - new Date(a.last_edited_time).getTime())
        .slice(0, 5)

      for (const page of allPages) {
        const name = getTitle(
          page.properties["Fragrance Name"] ||
          page.properties["Name"]
        )
        if (name) {
          stats.recentActivity.push({
            id: `notion-${page.id}`,
            action: `${page.source} updated`,
            target: name,
            timestamp: new Date(page.last_edited_time).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
          })
        }
      }

      // Sort all activity by timestamp
      stats.recentActivity.sort((a, b) => 0)
    } catch {
      // Notion not reachable
    }
  }

  return NextResponse.json(stats)
}
