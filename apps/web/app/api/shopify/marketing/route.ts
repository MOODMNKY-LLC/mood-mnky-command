import { NextResponse } from "next/server"
import { getMarketingEvents, getMarketingEventCount, isConfigured } from "@/lib/shopify"

export async function GET(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Shopify is not configured." }, { status: 503 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const countOnly = searchParams.get("count") === "true"
    const limit = parseInt(searchParams.get("limit") || "50", 10)

    if (countOnly) return NextResponse.json({ count: await getMarketingEventCount() })
    const events = await getMarketingEvents({ limit })
    return NextResponse.json({ marketing_events: events })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
