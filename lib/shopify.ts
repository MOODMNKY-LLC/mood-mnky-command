const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || ""
const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN || ""
const API_VERSION = "2024-10"

interface ShopifyRequestOptions {
  method?: string
  body?: Record<string, unknown>
}

async function shopifyAdminFetch<T>(
  endpoint: string,
  options: ShopifyRequestOptions = {}
): Promise<T> {
  const { method = "GET", body } = options
  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${API_VERSION}${endpoint}`

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(
      `Shopify Admin API error (${res.status}): ${errorText}`
    )
  }

  return res.json() as Promise<T>
}

// ---- Product Types ----

export interface ShopifyProduct {
  id: number
  title: string
  body_html: string
  vendor: string
  product_type: string
  status: "active" | "draft" | "archived"
  tags: string
  variants: ShopifyVariant[]
  images: ShopifyImage[]
  created_at: string
  updated_at: string
  handle: string
}

export interface ShopifyVariant {
  id: number
  product_id: number
  title: string
  price: string
  sku: string
  inventory_quantity: number
  option1: string | null
  option2: string | null
  option3: string | null
  weight: number
  weight_unit: string
}

export interface ShopifyImage {
  id: number
  product_id: number
  src: string
  alt: string | null
}

interface ShopifyProductsResponse {
  products: ShopifyProduct[]
}

interface ShopifyProductResponse {
  product: ShopifyProduct
}

interface ShopifyProductCountResponse {
  count: number
}

// ---- API Methods ----

export async function getProducts(
  params: {
    limit?: number
    status?: string
    product_type?: string
    collection_id?: string
    fields?: string
  } = {}
): Promise<ShopifyProduct[]> {
  const searchParams = new URLSearchParams()
  if (params.limit) searchParams.set("limit", String(params.limit))
  if (params.status) searchParams.set("status", params.status)
  if (params.product_type)
    searchParams.set("product_type", params.product_type)
  if (params.collection_id)
    searchParams.set("collection_id", params.collection_id)
  if (params.fields) searchParams.set("fields", params.fields)

  const query = searchParams.toString()
  const endpoint = `/products.json${query ? `?${query}` : ""}`

  const data = await shopifyAdminFetch<ShopifyProductsResponse>(endpoint)
  return data.products
}

export async function getProduct(id: number): Promise<ShopifyProduct> {
  const data = await shopifyAdminFetch<ShopifyProductResponse>(
    `/products/${id}.json`
  )
  return data.product
}

export async function getProductCount(): Promise<number> {
  const data = await shopifyAdminFetch<ShopifyProductCountResponse>(
    "/products/count.json"
  )
  return data.count
}

export async function createProduct(
  product: Partial<ShopifyProduct>
): Promise<ShopifyProduct> {
  const data = await shopifyAdminFetch<ShopifyProductResponse>(
    "/products.json",
    {
      method: "POST",
      body: { product },
    }
  )
  return data.product
}

export async function updateProduct(
  id: number,
  product: Partial<ShopifyProduct>
): Promise<ShopifyProduct> {
  const data = await shopifyAdminFetch<ShopifyProductResponse>(
    `/products/${id}.json`,
    {
      method: "PUT",
      body: { product },
    }
  )
  return data.product
}

export async function deleteProduct(id: number): Promise<void> {
  await shopifyAdminFetch(`/products/${id}.json`, { method: "DELETE" })
}

// ---- Store Info ----

interface ShopifyShopResponse {
  shop: {
    id: number
    name: string
    email: string
    domain: string
    myshopify_domain: string
    plan_name: string
    currency: string
    money_format: string
  }
}

export async function getShopInfo() {
  const data = await shopifyAdminFetch<ShopifyShopResponse>("/shop.json")
  return data.shop
}

// ---- Collections ----

interface ShopifyCollectionsResponse {
  custom_collections: Array<{
    id: number
    title: string
    handle: string
    body_html: string
    published_at: string | null
    sort_order: string
  }>
}

export async function getCollections() {
  const data = await shopifyAdminFetch<ShopifyCollectionsResponse>(
    "/custom_collections.json?limit=250"
  )
  return data.custom_collections
}

// ---- Inventory ----

export async function getInventoryLevels(inventoryItemIds: number[]) {
  const ids = inventoryItemIds.join(",")
  const data = await shopifyAdminFetch<{
    inventory_levels: Array<{
      inventory_item_id: number
      location_id: number
      available: number | null
    }>
  }>(`/inventory_levels.json?inventory_item_ids=${ids}`)
  return data.inventory_levels
}

export function isConfigured(): boolean {
  return Boolean(SHOPIFY_STORE_DOMAIN && SHOPIFY_ADMIN_API_TOKEN)
}
