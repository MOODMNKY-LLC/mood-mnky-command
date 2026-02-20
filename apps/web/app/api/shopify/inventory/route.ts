import { NextResponse } from "next/server"
import { getLocations, getProducts, getInventoryLevels, isConfigured } from "@/lib/shopify"

export async function GET(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Shopify is not configured." }, { status: 503 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "overview"

    if (type === "locations") {
      const locations = await getLocations()
      return NextResponse.json({ locations })
    }

    // Overview: locations + products with inventory
    const [locations, products] = await Promise.all([
      getLocations(),
      getProducts({ limit: 50, status: "active" }),
    ])

    // Collect all inventory item IDs from variants
    const inventoryItemIds = products.flatMap((p) =>
      p.variants.filter((v) => v.inventory_item_id).map((v) => v.inventory_item_id!)
    )

    let levels: Awaited<ReturnType<typeof getInventoryLevels>> = []
    if (inventoryItemIds.length > 0) {
      // Shopify limits to 50 IDs per request
      const chunks: number[][] = []
      for (let i = 0; i < inventoryItemIds.length; i += 50) {
        chunks.push(inventoryItemIds.slice(i, i + 50))
      }
      const results = await Promise.all(
        chunks.map((ids) => getInventoryLevels({ inventory_item_ids: ids }))
      )
      levels = results.flat()
    }

    return NextResponse.json({ locations, products, levels })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
