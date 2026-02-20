import { NextResponse } from "next/server"
import { requireInternalApiKey } from "@/lib/api/internal-auth"
import { storefrontFetch } from "@/lib/shopify/storefront-client"
import { z } from "zod"

const bodySchema = z.object({
  handle: z.string().min(1).optional(),
  query: z.string().min(1).optional(),
  gid: z.string().min(1).optional(),
})

const productByHandleQuery = `
  query ProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      handle
      variants(first: 10) {
        nodes { id }
      }
    }
  }
`

const nodeQuery = `
  query Node($id: ID!) {
    node(id: $id) {
      ... on Product {
        id
        title
        handle
        variants(first: 10) {
          nodes { id }
        }
      }
      ... on Collection {
        id
        title
        handle
      }
    }
  }
`

export async function POST(request: Request) {
  if (!requireInternalApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const handle = parsed.data.handle ?? parsed.data.query
  const gid = parsed.data.gid

  if (!handle && !gid) {
    return NextResponse.json(
      { error: "handle, query, or gid required" },
      { status: 400 }
    )
  }

  try {
    if (gid) {
      const gidFormatted = gid.startsWith("gid://") ? gid : `gid://shopify/Product/${gid}`
      const data = await storefrontFetch<{
        node?: { id: string; title?: string; handle?: string; variants?: { nodes: { id: string }[] } } | null
      }>(nodeQuery, { id: gidFormatted })

      const node = data?.node
      if (!node) {
        return NextResponse.json({ error: "Node not found", gid }, { status: 404 })
      }
      const isCollection = "variants" in node === false || !node.variants
      return NextResponse.json({
        type: isCollection ? "collection" : "product",
        gid: node.id,
        product_gid: isCollection ? null : node.id,
        title: node.title ?? null,
        handle: node.handle ?? null,
        variant_gids: node.variants?.nodes?.map((n) => n.id) ?? [],
      })
    }

    const data = await storefrontFetch<{
      productByHandle: { id: string; title: string; handle: string; variants: { nodes: { id: string }[] } } | null
    }>(productByHandleQuery, { handle })

    if (!data?.productByHandle) {
      return NextResponse.json(
        { error: "Product not found", handle },
        { status: 404 }
      )
    }

    const product = data.productByHandle
    return NextResponse.json({
      type: "product",
      gid: product.id,
      product_gid: product.id,
      title: product.title,
      handle: product.handle,
      variant_gids: product.variants?.nodes?.map((n) => n.id) ?? [],
    })
  } catch (err) {
    return NextResponse.json(
      {
        error: "Storefront request failed",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 502 }
    )
  }
}
