import { NextRequest, NextResponse } from "next/server"
import { pageCreate, isShopifyGraphQLConfigured } from "@/lib/shopify-admin-graphql"

export async function POST(request: NextRequest) {
  if (!isShopifyGraphQLConfigured()) {
    return NextResponse.json(
      { error: "Shopify is not configured. Add SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN." },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const {
      title,
      handle,
      body: pageBody,
      templateSuffix,
      isPublished,
    } = body as {
      title?: string
      handle?: string | null
      body?: string | null
      templateSuffix?: string | null
      isPublished?: boolean
    }

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { error: "title is required and must be a non-empty string." },
        { status: 400 }
      )
    }

    const page = await pageCreate({
      title: title.trim(),
      handle: handle != null ? (handle === "" ? null : String(handle).trim()) : undefined,
      body: pageBody != null ? (pageBody === "" ? null : String(pageBody)) : undefined,
      templateSuffix:
        templateSuffix != null
          ? templateSuffix === ""
            ? null
            : String(templateSuffix).trim()
          : undefined,
      isPublished,
    })

    return NextResponse.json({ page })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
