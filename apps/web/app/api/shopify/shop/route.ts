import { NextResponse } from "next/server"
import { getShopInfo, isConfigured } from "@/lib/shopify"

export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Shopify is not configured. Add environment variables." },
      { status: 503 }
    )
  }

  try {
    const shop = await getShopInfo()
    return NextResponse.json({ shop })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
