import { NextResponse } from "next/server"
import {
  getProducts,
  createProduct,
  getProductCount,
  isConfigured,
} from "@/lib/shopify"

export async function GET(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Shopify is not configured. Add SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN environment variables." },
      { status: 503 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const status = searchParams.get("status") || undefined
    const product_type = searchParams.get("product_type") || undefined
    const countOnly = searchParams.get("count") === "true"

    if (countOnly) {
      const count = await getProductCount()
      return NextResponse.json({ count })
    }

    const products = await getProducts({ limit, status, product_type })
    return NextResponse.json({ products })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Shopify is not configured." },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()

    const product = await createProduct({
      title: body.title,
      body_html: body.body_html || body.description || "",
      vendor: body.vendor || "MOOD MNKY",
      product_type: body.product_type || "Candle",
      status: body.status || "draft",
      tags: body.tags || "",
      variants: body.variants || [
        {
          price: body.price || "0.00",
          sku: body.sku || "",
          inventory_quantity: body.inventory_quantity || 0,
          weight: body.weight || 0,
          weight_unit: "g",
        } as any,
      ],
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
