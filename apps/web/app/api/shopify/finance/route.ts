import { NextResponse } from "next/server"
import { getShopifyPaymentsBalance, getPayouts, isConfigured } from "@/lib/shopify"

export async function GET(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Shopify is not configured." }, { status: 503 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "overview"

    if (type === "balance") {
      const balance = await getShopifyPaymentsBalance()
      return NextResponse.json({ balance })
    }

    if (type === "payouts") {
      const limit = parseInt(searchParams.get("limit") || "20", 10)
      const payouts = await getPayouts({ limit })
      return NextResponse.json({ payouts })
    }

    // Overview: balance + recent payouts
    const [balance, payouts] = await Promise.all([
      getShopifyPaymentsBalance(),
      getPayouts({ limit: 10 }),
    ])
    return NextResponse.json({ balance, payouts })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
