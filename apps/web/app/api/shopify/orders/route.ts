import { NextResponse } from "next/server"
import { getOrders, getOrderCount, getDraftOrders, getDraftOrderCount, getAbandonedCheckouts, getAbandonedCheckoutCount, isConfigured } from "@/lib/shopify"

export async function GET(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Shopify is not configured." }, { status: 503 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "orders"
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const status = searchParams.get("status") || undefined
    const countOnly = searchParams.get("count") === "true"

    if (type === "draft") {
      if (countOnly) return NextResponse.json({ count: await getDraftOrderCount() })
      const drafts = await getDraftOrders({ limit, status })
      return NextResponse.json({ draft_orders: drafts })
    }

    if (type === "abandoned") {
      if (countOnly) return NextResponse.json({ count: await getAbandonedCheckoutCount() })
      const checkouts = await getAbandonedCheckouts({ limit })
      return NextResponse.json({ checkouts })
    }

    if (countOnly) return NextResponse.json({ count: await getOrderCount({ status: status || "any" }) })
    const orders = await getOrders({ limit, status: (status as "open" | "closed" | "cancelled" | "any") || "any" })
    return NextResponse.json({ orders })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
