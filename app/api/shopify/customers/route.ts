import { NextResponse } from "next/server"
import { getCustomers, getCustomerCount, searchCustomers, isConfigured } from "@/lib/shopify"

export async function GET(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Shopify is not configured." }, { status: 503 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const query = searchParams.get("query")
    const countOnly = searchParams.get("count") === "true"

    if (countOnly) return NextResponse.json({ count: await getCustomerCount() })
    if (query) {
      const customers = await searchCustomers(query)
      return NextResponse.json({ customers })
    }
    const customers = await getCustomers({ limit })
    return NextResponse.json({ customers })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
