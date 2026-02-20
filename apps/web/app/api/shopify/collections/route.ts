import { NextResponse } from "next/server"
import { getAllCollections, getCollectionProducts, isConfigured } from "@/lib/shopify"

export async function GET(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Shopify is not configured." }, { status: 503 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const collectionId = searchParams.get("collection_id")

    if (collectionId) {
      const products = await getCollectionProducts(parseInt(collectionId, 10))
      return NextResponse.json({ products })
    }

    const collections = await getAllCollections()
    return NextResponse.json({ collections })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
