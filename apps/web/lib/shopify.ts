const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || ""
const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN || ""
const API_VERSION = "2024-10"

// ---- Core Fetch ----

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
    throw new Error(`Shopify Admin API error (${res.status}): ${errorText}`)
  }

  return res.json() as Promise<T>
}

// ---- Shared Types ----

export interface ShopifyImage {
  id: number
  product_id?: number
  src: string
  alt: string | null
  width?: number
  height?: number
}

export interface ShopifyMoney {
  amount: string
  currency_code: string
}

// ---- Products ----

export interface ShopifyVariant {
  id: number
  product_id: number
  title: string
  price: string
  compare_at_price: string | null
  sku: string
  inventory_quantity: number
  inventory_item_id?: number
  option1: string | null
  option2: string | null
  option3: string | null
  weight: number
  weight_unit: string
  barcode: string | null
  requires_shipping: boolean
  taxable: boolean
}

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
  options: Array<{ id: number; name: string; values: string[] }>
  created_at: string
  updated_at: string
  published_at: string | null
  handle: string
  template_suffix: string | null
}

export async function getProducts(
  params: {
    limit?: number
    status?: string
    product_type?: string
    collection_id?: string
    fields?: string
    since_id?: number
  } = {}
): Promise<ShopifyProduct[]> {
  const sp = new URLSearchParams()
  if (params.limit) sp.set("limit", String(params.limit))
  if (params.status) sp.set("status", params.status)
  if (params.product_type) sp.set("product_type", params.product_type)
  if (params.collection_id) sp.set("collection_id", params.collection_id)
  if (params.fields) sp.set("fields", params.fields)
  if (params.since_id) sp.set("since_id", String(params.since_id))
  const q = sp.toString()
  const data = await shopifyAdminFetch<{ products: ShopifyProduct[] }>(
    `/products.json${q ? `?${q}` : ""}`
  )
  return data.products
}

export async function getProduct(id: number): Promise<ShopifyProduct> {
  const data = await shopifyAdminFetch<{ product: ShopifyProduct }>(`/products/${id}.json`)
  return data.product
}

export async function getProductCount(params: { status?: string } = {}): Promise<number> {
  const sp = new URLSearchParams()
  if (params.status) sp.set("status", params.status)
  const q = sp.toString()
  const data = await shopifyAdminFetch<{ count: number }>(
    `/products/count.json${q ? `?${q}` : ""}`
  )
  return data.count
}

export async function createProduct(product: Partial<ShopifyProduct>): Promise<ShopifyProduct> {
  const data = await shopifyAdminFetch<{ product: ShopifyProduct }>("/products.json", {
    method: "POST",
    body: { product },
  })
  return data.product
}

export async function updateProduct(id: number, product: Partial<ShopifyProduct>): Promise<ShopifyProduct> {
  const data = await shopifyAdminFetch<{ product: ShopifyProduct }>(`/products/${id}.json`, {
    method: "PUT",
    body: { product },
  })
  return data.product
}

export async function deleteProduct(id: number): Promise<void> {
  await shopifyAdminFetch(`/products/${id}.json`, { method: "DELETE" })
}

export async function createProductImage(
  productId: number,
  src: string,
  position?: number
): Promise<ShopifyImage> {
  const body: { image: { src: string; position?: number } } = { image: { src } }
  if (position != null) body.image.position = position
  const data = await shopifyAdminFetch<{ image: ShopifyImage }>(
    `/products/${productId}/images.json`,
    { method: "POST", body }
  )
  return data.image
}

export async function deleteProductImage(productId: number, imageId: number): Promise<void> {
  await shopifyAdminFetch(`/products/${productId}/images/${imageId}.json`, {
    method: "DELETE",
  })
}

// ---- Collections ----

export interface ShopifyCollection {
  id: number
  title: string
  handle: string
  body_html: string
  published_at: string | null
  sort_order: string
  image?: ShopifyImage | null
  products_count?: number
  collection_type?: "custom" | "smart"
  rules?: Array<{ column: string; relation: string; condition: string }>
  disjunctive?: boolean
  updated_at: string
}

export async function getCustomCollections(params: { limit?: number } = {}): Promise<ShopifyCollection[]> {
  const sp = new URLSearchParams()
  if (params.limit) sp.set("limit", String(params.limit))
  const q = sp.toString()
  const data = await shopifyAdminFetch<{ custom_collections: ShopifyCollection[] }>(
    `/custom_collections.json${q ? `?${q}` : `?limit=250`}`
  )
  return data.custom_collections.map((c) => ({ ...c, collection_type: "custom" as const }))
}

export async function getSmartCollections(params: { limit?: number } = {}): Promise<ShopifyCollection[]> {
  const sp = new URLSearchParams()
  if (params.limit) sp.set("limit", String(params.limit))
  const q = sp.toString()
  const data = await shopifyAdminFetch<{ smart_collections: ShopifyCollection[] }>(
    `/smart_collections.json${q ? `?${q}` : `?limit=250`}`
  )
  return data.smart_collections.map((c) => ({ ...c, collection_type: "smart" as const }))
}

/** Returns only active (published) collections. */
export async function getAllCollections(): Promise<ShopifyCollection[]> {
  const [custom, smart] = await Promise.all([getCustomCollections(), getSmartCollections()])
  const all = [...custom, ...smart]
  return all.filter((c) => c.published_at != null)
}

export async function getCollectionProducts(collectionId: number): Promise<ShopifyProduct[]> {
  const data = await shopifyAdminFetch<{ products: ShopifyProduct[] }>(
    `/collections/${collectionId}/products.json?limit=250`
  )
  return data.products
}

// ---- Orders ----

export interface ShopifyOrderLineItem {
  id: number
  title: string
  quantity: number
  price: string
  sku: string
  variant_title: string
  vendor: string
  product_id: number | null
  variant_id: number | null
  fulfillment_status: string | null
}

export interface ShopifyAddress {
  first_name: string
  last_name: string
  address1: string
  address2: string | null
  city: string
  province: string
  country: string
  zip: string
  phone: string | null
  company: string | null
}

export interface ShopifyOrder {
  id: number
  name: string
  email: string
  created_at: string
  updated_at: string
  closed_at: string | null
  cancelled_at: string | null
  processed_at: string
  financial_status: "pending" | "authorized" | "partially_paid" | "paid" | "partially_refunded" | "refunded" | "voided"
  fulfillment_status: "fulfilled" | "partial" | "unfulfilled" | "restocked" | null
  total_price: string
  subtotal_price: string
  total_tax: string
  total_discounts: string
  total_shipping_price_set?: { shop_money: ShopifyMoney }
  currency: string
  order_number: number
  note: string | null
  tags: string
  line_items: ShopifyOrderLineItem[]
  shipping_address?: ShopifyAddress
  billing_address?: ShopifyAddress
  customer?: ShopifyCustomer
  refunds: Array<{ id: number; created_at: string }>
  cancel_reason: string | null
  gateway: string
  source_name: string
}

export async function getOrders(
  params: {
    limit?: number
    status?: "open" | "closed" | "cancelled" | "any"
    financial_status?: string
    fulfillment_status?: string
    since_id?: number
    created_at_min?: string
    created_at_max?: string
    fields?: string
  } = {}
): Promise<ShopifyOrder[]> {
  const sp = new URLSearchParams()
  sp.set("limit", String(params.limit || 50))
  if (params.status) sp.set("status", params.status)
  if (params.financial_status) sp.set("financial_status", params.financial_status)
  if (params.fulfillment_status) sp.set("fulfillment_status", params.fulfillment_status)
  if (params.since_id) sp.set("since_id", String(params.since_id))
  if (params.created_at_min) sp.set("created_at_min", params.created_at_min)
  if (params.created_at_max) sp.set("created_at_max", params.created_at_max)
  if (params.fields) sp.set("fields", params.fields)
  const data = await shopifyAdminFetch<{ orders: ShopifyOrder[] }>(`/orders.json?${sp.toString()}`)
  return data.orders
}

export async function getOrder(id: number): Promise<ShopifyOrder> {
  const data = await shopifyAdminFetch<{ order: ShopifyOrder }>(`/orders/${id}.json`)
  return data.order
}

export async function getOrderCount(params: { status?: string } = {}): Promise<number> {
  const sp = new URLSearchParams()
  if (params.status) sp.set("status", params.status)
  const q = sp.toString()
  const data = await shopifyAdminFetch<{ count: number }>(`/orders/count.json${q ? `?${q}` : ""}`)
  return data.count
}

export async function cancelOrder(id: number, reason?: string): Promise<ShopifyOrder> {
  const body: Record<string, unknown> = {}
  if (reason) body.reason = reason
  const data = await shopifyAdminFetch<{ order: ShopifyOrder }>(`/orders/${id}/cancel.json`, {
    method: "POST",
    body,
  })
  return data.order
}

export async function closeOrder(id: number): Promise<ShopifyOrder> {
  const data = await shopifyAdminFetch<{ order: ShopifyOrder }>(`/orders/${id}/close.json`, {
    method: "POST",
    body: {},
  })
  return data.order
}

// ---- Draft Orders ----

export interface ShopifyDraftOrder {
  id: number
  name: string
  email: string
  status: "open" | "invoice_sent" | "completed"
  created_at: string
  updated_at: string
  completed_at: string | null
  total_price: string
  subtotal_price: string
  total_tax: string
  currency: string
  note: string | null
  tags: string
  line_items: ShopifyOrderLineItem[]
  customer?: ShopifyCustomer
  shipping_address?: ShopifyAddress
  billing_address?: ShopifyAddress
  invoice_url: string
  order_id: number | null
}

export async function getDraftOrders(params: { limit?: number; status?: string } = {}): Promise<ShopifyDraftOrder[]> {
  const sp = new URLSearchParams()
  sp.set("limit", String(params.limit || 50))
  if (params.status) sp.set("status", params.status)
  const data = await shopifyAdminFetch<{ draft_orders: ShopifyDraftOrder[] }>(`/draft_orders.json?${sp.toString()}`)
  return data.draft_orders
}

export async function getDraftOrderCount(): Promise<number> {
  const data = await shopifyAdminFetch<{ count: number }>("/draft_orders/count.json")
  return data.count
}

// ---- Abandoned Checkouts ----

export interface ShopifyAbandonedCheckout {
  id: number
  token: string
  created_at: string
  updated_at: string
  completed_at: string | null
  email: string
  total_price: string
  subtotal_price: string
  total_tax: string
  currency: string
  abandoned_checkout_url: string
  customer?: ShopifyCustomer
  line_items: ShopifyOrderLineItem[]
}

export async function getAbandonedCheckouts(params: { limit?: number } = {}): Promise<ShopifyAbandonedCheckout[]> {
  const sp = new URLSearchParams()
  sp.set("limit", String(params.limit || 50))
  const data = await shopifyAdminFetch<{ checkouts: ShopifyAbandonedCheckout[] }>(
    `/checkouts.json?${sp.toString()}`
  )
  return data.checkouts
}

export async function getAbandonedCheckoutCount(): Promise<number> {
  const data = await shopifyAdminFetch<{ count: number }>("/checkouts/count.json")
  return data.count
}

// ---- Customers ----

export interface ShopifyCustomer {
  id: number
  email: string
  first_name: string
  last_name: string
  phone: string | null
  orders_count: number
  total_spent: string
  state: "disabled" | "invited" | "enabled" | "declined"
  verified_email: boolean
  tags: string
  currency: string
  created_at: string
  updated_at: string
  note: string | null
  default_address?: ShopifyAddress
  addresses?: ShopifyAddress[]
  accepts_marketing: boolean
  last_order_id: number | null
  last_order_name: string | null
}

export async function getCustomers(
  params: { limit?: number; since_id?: number; fields?: string } = {}
): Promise<ShopifyCustomer[]> {
  const sp = new URLSearchParams()
  sp.set("limit", String(params.limit || 50))
  if (params.since_id) sp.set("since_id", String(params.since_id))
  if (params.fields) sp.set("fields", params.fields)
  const data = await shopifyAdminFetch<{ customers: ShopifyCustomer[] }>(`/customers.json?${sp.toString()}`)
  return data.customers
}

export async function getCustomer(id: number): Promise<ShopifyCustomer> {
  const data = await shopifyAdminFetch<{ customer: ShopifyCustomer }>(`/customers/${id}.json`)
  return data.customer
}

export async function getCustomerCount(): Promise<number> {
  const data = await shopifyAdminFetch<{ count: number }>("/customers/count.json")
  return data.count
}

export async function searchCustomers(query: string): Promise<ShopifyCustomer[]> {
  const data = await shopifyAdminFetch<{ customers: ShopifyCustomer[] }>(
    `/customers/search.json?query=${encodeURIComponent(query)}&limit=50`
  )
  return data.customers
}

// ---- Discounts (Price Rules + Discount Codes) ----

export interface ShopifyPriceRule {
  id: number
  title: string
  target_type: "line_item" | "shipping_line"
  target_selection: "all" | "entitled"
  allocation_method: "across" | "each"
  value_type: "fixed_amount" | "percentage"
  value: string
  usage_limit: number | null
  starts_at: string
  ends_at: string | null
  created_at: string
  updated_at: string
  once_per_customer: boolean
  customer_selection: "all" | "prerequisite"
  prerequisite_subtotal_range: { greater_than_or_equal_to: string } | null
  entitled_product_ids: number[]
  entitled_collection_ids: number[]
}

export interface ShopifyDiscountCode {
  id: number
  price_rule_id: number
  code: string
  usage_count: number
  created_at: string
  updated_at: string
}

export async function getPriceRules(params: { limit?: number } = {}): Promise<ShopifyPriceRule[]> {
  const sp = new URLSearchParams()
  sp.set("limit", String(params.limit || 50))
  const data = await shopifyAdminFetch<{ price_rules: ShopifyPriceRule[] }>(`/price_rules.json?${sp.toString()}`)
  return data.price_rules
}

export async function getDiscountCodes(priceRuleId: number): Promise<ShopifyDiscountCode[]> {
  const data = await shopifyAdminFetch<{ discount_codes: ShopifyDiscountCode[] }>(
    `/price_rules/${priceRuleId}/discount_codes.json`
  )
  return data.discount_codes
}

export async function getPriceRuleCount(): Promise<number> {
  const data = await shopifyAdminFetch<{ count: number }>("/price_rules/count.json")
  return data.count
}

// ---- Gift Cards ----

export interface ShopifyGiftCard {
  id: number
  balance: string
  currency: string
  initial_value: string
  disabled_at: string | null
  expires_on: string | null
  created_at: string
  updated_at: string
  last_characters: string
  note: string | null
  customer_id: number | null
  line_item_id: number | null
  order_id: number | null
}

export async function getGiftCards(params: { limit?: number; status?: string } = {}): Promise<ShopifyGiftCard[]> {
  const sp = new URLSearchParams()
  sp.set("limit", String(params.limit || 50))
  if (params.status) sp.set("status", params.status)
  const data = await shopifyAdminFetch<{ gift_cards: ShopifyGiftCard[] }>(`/gift_cards.json?${sp.toString()}`)
  return data.gift_cards
}

export async function getGiftCardCount(params: { status?: string } = {}): Promise<number> {
  const sp = new URLSearchParams()
  if (params.status) sp.set("status", params.status)
  const q = sp.toString()
  const data = await shopifyAdminFetch<{ count: number }>(`/gift_cards/count.json${q ? `?${q}` : ""}`)
  return data.count
}

// ---- Content: Pages ----

export interface ShopifyPage {
  id: number
  title: string
  handle: string
  body_html: string
  author: string
  created_at: string
  updated_at: string
  published_at: string | null
  template_suffix: string | null
}

export async function getPages(params: { limit?: number } = {}): Promise<ShopifyPage[]> {
  const sp = new URLSearchParams()
  sp.set("limit", String(params.limit || 50))
  const data = await shopifyAdminFetch<{ pages: ShopifyPage[] }>(`/pages.json?${sp.toString()}`)
  return data.pages
}

export async function getPageCount(): Promise<number> {
  const data = await shopifyAdminFetch<{ count: number }>("/pages/count.json")
  return data.count
}

// ---- Content: Blogs & Articles ----

export interface ShopifyBlog {
  id: number
  title: string
  handle: string
  commentable: string
  created_at: string
  updated_at: string
}

export interface ShopifyArticle {
  id: number
  blog_id: number
  title: string
  author: string
  body_html: string
  summary_html: string | null
  handle: string
  tags: string
  published_at: string | null
  created_at: string
  updated_at: string
  image?: ShopifyImage
}

export async function getBlogs(): Promise<ShopifyBlog[]> {
  const data = await shopifyAdminFetch<{ blogs: ShopifyBlog[] }>("/blogs.json")
  return data.blogs
}

export async function getBlogArticles(blogId: number, params: { limit?: number } = {}): Promise<ShopifyArticle[]> {
  const sp = new URLSearchParams()
  sp.set("limit", String(params.limit || 50))
  const data = await shopifyAdminFetch<{ articles: ShopifyArticle[] }>(
    `/blogs/${blogId}/articles.json?${sp.toString()}`
  )
  return data.articles
}

export async function getArticleCount(blogId: number): Promise<number> {
  const data = await shopifyAdminFetch<{ count: number }>(`/blogs/${blogId}/articles/count.json`)
  return data.count
}

// ---- Content: Redirects ----

export interface ShopifyRedirect {
  id: number
  path: string
  target: string
}

export async function getRedirects(params: { limit?: number } = {}): Promise<ShopifyRedirect[]> {
  const sp = new URLSearchParams()
  sp.set("limit", String(params.limit || 250))
  const data = await shopifyAdminFetch<{ redirects: ShopifyRedirect[] }>(`/redirects.json?${sp.toString()}`)
  return data.redirects
}

// ---- Inventory ----

export interface ShopifyLocation {
  id: number
  name: string
  address1: string
  city: string
  province: string
  country: string
  zip: string
  active: boolean
  legacy: boolean
}

export interface ShopifyInventoryLevel {
  inventory_item_id: number
  location_id: number
  available: number | null
  updated_at?: string
}

export async function getLocations(): Promise<ShopifyLocation[]> {
  const data = await shopifyAdminFetch<{ locations: ShopifyLocation[] }>("/locations.json")
  return data.locations
}

export async function getInventoryLevels(params: { inventory_item_ids?: number[]; location_ids?: number[] }): Promise<ShopifyInventoryLevel[]> {
  const sp = new URLSearchParams()
  if (params.inventory_item_ids?.length) sp.set("inventory_item_ids", params.inventory_item_ids.join(","))
  if (params.location_ids?.length) sp.set("location_ids", params.location_ids.join(","))
  const data = await shopifyAdminFetch<{ inventory_levels: ShopifyInventoryLevel[] }>(
    `/inventory_levels.json?${sp.toString()}`
  )
  return data.inventory_levels
}

// ---- Marketing Events ----

export interface ShopifyMarketingEvent {
  id: number
  event_type: string
  marketing_channel: string
  paid: boolean
  referring_domain: string | null
  budget: string
  currency: string
  budget_type: string
  started_at: string
  ended_at: string | null
  utm_campaign: string | null
  utm_source: string | null
  utm_medium: string | null
  description: string
  manage_url: string | null
  preview_url: string | null
}

export async function getMarketingEvents(params: { limit?: number } = {}): Promise<ShopifyMarketingEvent[]> {
  const sp = new URLSearchParams()
  sp.set("limit", String(params.limit || 50))
  const data = await shopifyAdminFetch<{ marketing_events: ShopifyMarketingEvent[] }>(
    `/marketing_events.json?${sp.toString()}`
  )
  return data.marketing_events
}

export async function getMarketingEventCount(): Promise<number> {
  const data = await shopifyAdminFetch<{ count: number }>("/marketing_events/count.json")
  return data.count
}

// ---- Finance: Shopify Payments ----

export interface ShopifyPayout {
  id: number
  status: "scheduled" | "in_transit" | "paid" | "failed" | "cancelled"
  amount: string
  currency: string
  date: string
}

export interface ShopifyBalance {
  currency: string
  amount: string
}

export interface ShopifyPayoutTransaction {
  id: number
  type: string
  amount: string
  fee: string
  net: string
  payout_id: number
  payout_status: string
  source_id: number
  source_type: string
  source_order_id: number | null
}

export async function getShopifyPaymentsBalance(): Promise<ShopifyBalance[]> {
  const data = await shopifyAdminFetch<{ balance: ShopifyBalance[] }>("/shopify_payments/balance.json")
  return data.balance
}

export async function getPayouts(params: { limit?: number; status?: string } = {}): Promise<ShopifyPayout[]> {
  const sp = new URLSearchParams()
  sp.set("limit", String(params.limit || 20))
  if (params.status) sp.set("status", params.status)
  const data = await shopifyAdminFetch<{ payouts: ShopifyPayout[] }>(
    `/shopify_payments/payouts.json?${sp.toString()}`
  )
  return data.payouts
}

export async function getPayoutTransactions(payoutId: number): Promise<ShopifyPayoutTransaction[]> {
  const data = await shopifyAdminFetch<{ transactions: ShopifyPayoutTransaction[] }>(
    `/shopify_payments/balance/transactions.json?payout_id=${payoutId}`
  )
  return data.transactions
}

// ---- Analytics: Reports ----

export interface ShopifyReport {
  id: number
  name: string
  shopify_ql: string
  category: string
  updated_at: string
}

export async function getReports(params: { limit?: number } = {}): Promise<ShopifyReport[]> {
  const sp = new URLSearchParams()
  sp.set("limit", String(params.limit || 50))
  const data = await shopifyAdminFetch<{ reports: ShopifyReport[] }>(`/reports.json?${sp.toString()}`)
  return data.reports
}

// ---- Store Info ----

export interface ShopifyShop {
  id: number
  name: string
  email: string
  domain: string
  myshopify_domain: string
  plan_name: string
  currency: string
  money_format: string
  timezone: string
  iana_timezone: string
  country_name: string
  province: string
  city: string
  address1: string
  phone: string
  weight_unit: string
  primary_locale: string
  shop_owner: string
  plan_display_name: string
  has_storefront: boolean
  eligible_for_payments: boolean
  created_at: string
  updated_at: string
}

export async function getShopInfo(): Promise<ShopifyShop> {
  const data = await shopifyAdminFetch<{ shop: ShopifyShop }>("/shop.json")
  return data.shop
}

// ---- Access Scopes ----

export async function getAccessScopes(): Promise<string[]> {
  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/oauth/access_scopes.json`
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
    },
    cache: "no-store",
  })
  if (!res.ok) return []
  const data = (await res.json()) as { access_scopes: Array<{ handle: string }> }
  return data.access_scopes.map((s) => s.handle)
}

// ---- Utility ----

export function isConfigured(): boolean {
  return Boolean(SHOPIFY_STORE_DOMAIN && SHOPIFY_ADMIN_API_TOKEN)
}

export function getStoreDomain(): string {
  return SHOPIFY_STORE_DOMAIN
}

export function getAdminUrl(): string {
  return `https://${SHOPIFY_STORE_DOMAIN}/admin`
}
