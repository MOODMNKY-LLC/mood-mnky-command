import { NextResponse } from "next/server"
import { getAccessScopes, isConfigured } from "@/lib/shopify"

export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Shopify is not configured." }, { status: 503 })
  }
  try {
    const scopes = await getAccessScopes()
    return NextResponse.json({ scopes })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
