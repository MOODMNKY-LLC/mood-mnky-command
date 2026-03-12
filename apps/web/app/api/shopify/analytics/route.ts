import { NextResponse } from "next/server"
import {
  getOrders,
  getOrderCount,
  getCustomerCount,
  getProductCount,
  getReports,
  getShopInfo,
  isConfigured,
} from "@/lib/shopify"

export async function GET(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Shopify is not configured." }, { status: 503 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "overview"

    if (type === "reports") {
      const reports = await getReports({ limit: 50 })
      return NextResponse.json({ reports })
    }

    // Overview analytics: aggregate key metrics
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      recentOrders,
      shop,
    ] = await Promise.all([
      getOrderCount({ status: "any" }),
      getCustomerCount(),
      getProductCount(),
      getOrders({ limit: 250, created_at_min: thirtyDaysAgo, status: "any" }),
      getShopInfo(),
    ])

    // Calculate revenue from last 30 days
    const revenue30d = recentOrders.reduce((sum, o) => sum + parseFloat(o.total_price || "0"), 0)
    const orders30d = recentOrders.length
    const avgOrderValue = orders30d > 0 ? revenue30d / orders30d : 0

    // Fulfillment breakdown
    const fulfillmentBreakdown = {
      fulfilled: recentOrders.filter((o) => o.fulfillment_status === "fulfilled").length,
      partial: recentOrders.filter((o) => o.fulfillment_status === "partial").length,
      unfulfilled: recentOrders.filter((o) => !o.fulfillment_status || o.fulfillment_status === "unfulfilled").length,
    }

    // Financial status breakdown
    const financialBreakdown = {
      paid: recentOrders.filter((o) => o.financial_status === "paid").length,
      pending: recentOrders.filter((o) => o.financial_status === "pending").length,
      refunded: recentOrders.filter((o) => o.financial_status === "refunded" || o.financial_status === "partially_refunded").length,
    }

    // Daily revenue for last 30 days
    const dailyRevenue: Record<string, number> = {}
    for (const order of recentOrders) {
      const day = new Date(order.created_at).toISOString().split("T")[0]
      dailyRevenue[day] = (dailyRevenue[day] || 0) + parseFloat(order.total_price || "0")
    }
    const revenueTimeline = Object.entries(dailyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))

    // Top products by order count
    const productCounts: Record<string, { title: string; count: number; revenue: number }> = {}
    for (const order of recentOrders) {
      for (const item of order.line_items) {
        const key = String(item.product_id || item.title)
        if (!productCounts[key]) productCounts[key] = { title: item.title, count: 0, revenue: 0 }
        productCounts[key].count += item.quantity
        productCounts[key].revenue += parseFloat(item.price) * item.quantity
      }
    }
    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    return NextResponse.json({
      totals: { totalOrders, totalCustomers, totalProducts },
      period: { orders30d, revenue30d, avgOrderValue },
      fulfillmentBreakdown,
      financialBreakdown,
      revenueTimeline,
      topProducts,
      currency: shop.currency,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
