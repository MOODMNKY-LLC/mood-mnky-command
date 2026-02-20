import { NextRequest, NextResponse } from "next/server"

function getBaseUrl(request: NextRequest): string {
  try {
    return new URL(request.url).origin
  } catch {
    return process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
  }
}

export async function POST(request: NextRequest) {
  const base = getBaseUrl(request)
  const notionRes = await fetch(`${base}/api/notion/sync/all`, { method: "POST" })
  const notionData = await notionRes.json().catch(() => ({ results: [] }))

  const shopifyRes = await fetch(`${base}/api/shopify/sync/metaobject-fragrance-notes`, {
    method: "POST",
  })
  const shopifyData = await shopifyRes.json().catch(() => ({ error: "Request failed" }))

  return NextResponse.json({
    notion: {
      results: notionData.results ?? [],
      ok: notionRes.ok,
    },
    shopify: shopifyRes.ok
      ? {
          created: shopifyData.created ?? 0,
          updated: shopifyData.updated ?? 0,
          total: shopifyData.total ?? 0,
          errors: shopifyData.errors,
        }
      : { error: shopifyData.error ?? `HTTP ${shopifyRes.status}` },
  })
}
