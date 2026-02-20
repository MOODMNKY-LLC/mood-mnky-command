import { NextRequest, NextResponse } from "next/server"
import { pageUpdate, isShopifyGraphQLConfigured } from "@/lib/shopify-admin-graphql"

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isShopifyGraphQLConfigured()) {
    return NextResponse.json(
      { error: "Shopify is not configured. Add SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN." },
      { status: 503 }
    )
  }

  const { id } = await params
  const numericId = Number(id)
  if (Number.isNaN(numericId) || numericId < 1) {
    return NextResponse.json({ error: "Invalid page id." }, { status: 400 })
  }

  try {
    const body = await _request.json()
    const {
      title,
      handle,
      body: pageBody,
      templateSuffix,
      isPublished,
    } = body as {
      title?: string | null
      handle?: string | null
      body?: string | null
      templateSuffix?: string | null
      isPublished?: boolean
    }

    const page = await pageUpdate(numericId, {
      title: title != null ? (title === "" ? null : String(title).trim()) : undefined,
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
