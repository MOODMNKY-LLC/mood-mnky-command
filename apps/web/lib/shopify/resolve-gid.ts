import { storefrontFetch } from "@/lib/shopify/storefront-client"

const RESOLVE_NODE_QUERY = `
  query ResolveNode($id: ID!) {
    node(id: $id) {
      ... on Product {
        handle
      }
      ... on ProductVariant {
        product {
          handle
        }
      }
      ... on Collection {
        handle
      }
    }
  }
`

export type ResolveGidResult =
  | { ok: true; handle: string; url: string; resourceType: "product" | "collection" }
  | { ok: false; error: string }

/**
 * Resolves a Shopify GID to a Verse URL (product or collection page).
 * Uses Storefront API node query. Hotspot type hints URL path (product/variant -> products, collection/bundle -> collections).
 */
export async function resolveGidToVerseUrl(
  shopifyGid: string,
  type: "product" | "variant" | "collection" | "bundle"
): Promise<ResolveGidResult> {
  if (!shopifyGid?.trim()) {
    return { ok: false, error: "Missing GID" }
  }

  const gid = shopifyGid.startsWith("gid://") ? shopifyGid : `gid://shopify/Product/${shopifyGid}`

  try {
    const data = await storefrontFetch<{
      node?:
        | { handle?: string }
        | { product?: { handle?: string } }
        | null
    }>(RESOLVE_NODE_QUERY, { id: gid })

    const node = data.node
    if (!node) {
      return { ok: false, error: "Node not found" }
    }

    let handle: string | undefined
    let isCollection = false

    if ("handle" in node && typeof node.handle === "string") {
      handle = node.handle
      isCollection = gid.includes("/Collection/")
    } else if ("product" in node && node.product?.handle) {
      handle = node.product.handle
    }

    if (!handle) {
      return { ok: false, error: "No handle in response" }
    }

    const useCollection =
      type === "collection" || (type === "bundle" && isCollection)
    const resourceType = useCollection ? "collection" : "product"
    const url = useCollection
      ? `/verse/collections/${handle}`
      : `/verse/products/${handle}`

    return { ok: true, handle, url, resourceType }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Resolution failed",
    }
  }
}
