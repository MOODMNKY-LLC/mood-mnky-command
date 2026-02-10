import { NextResponse } from "next/server"
import { getProductCount, getProducts, getAllCollections, isConfigured as shopifyConfigured } from "@/lib/shopify"
import { getDatabaseInfo, NOTION_DATABASE_IDS, isConfigured as notionConfigured } from "@/lib/notion"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const stats = {
    totalProducts: 0,
    totalFragrances: 0,
    totalFormulas: 0,
    totalCollections: 0,
    shopifyConnected: false,
    notionConnected: false,
    recentActivity: [] as Array<{ id: string; action: string; target: string; timestamp: string; _sort: number }>,
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
        const dt = new Date(product.updated_at)
        stats.recentActivity.push({
          id: `shopify-${product.id}`,
          action: "Product updated",
          target: product.title,
          timestamp: dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          _sort: dt.getTime(),
        })
      }
    } catch {
      // Shopify not reachable
    }
  }

  // Use admin client so counts are accurate regardless of auth (RLS would otherwise hide fragrance_oils from anon)
  const supabase = createAdminClient()

  // Fetch formulas count from database (Whole Elise formulas)
  try {
    const { count } = await supabase.from("formulas").select("*", { count: "exact", head: true })
    stats.totalFormulas = count ?? 0
  } catch {
    // DB not reachable
  }

  // Fetch fragrance count and recent activity from Supabase (synced from Notion)
  try {
    const { count } = await supabase.from("fragrance_oils").select("*", { count: "exact", head: true })
    stats.totalFragrances = count ?? 0

    const { data: recentFragrances } = await supabase
      .from("fragrance_oils")
      .select("id, name, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5)

    for (const row of recentFragrances ?? []) {
      const dt = new Date(row.updated_at ?? 0)
      stats.recentActivity.push({
        id: `fragrance-${row.id}`,
        action: "Fragrance updated",
        target: row.name ?? "Unknown",
        timestamp: dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        _sort: dt.getTime(),
      })
    }
  } catch {
    // DB not reachable
  }

  // Lightweight Notion connection check
  if (notionConfigured()) {
    try {
      await getDatabaseInfo(NOTION_DATABASE_IDS.fragranceOils)
      stats.notionConnected = true
    } catch {
      // Notion not reachable
    }
  }

  // Sort all activity by timestamp (newest first), then strip _sort from response
  stats.recentActivity.sort((a, b) => b._sort - a._sort)
  const recentActivity = stats.recentActivity.map(({ _sort, ...r }) => r)

  return NextResponse.json({ ...stats, recentActivity })
}
