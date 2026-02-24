const NOTION_API_KEY = process.env.NOTION_API_KEY || ""
const NOTION_API_VERSION = "2022-06-28"
const NOTION_BASE_URL = "https://api.notion.com/v1"

// ---- MNKY_MIND Database IDs ----
// MNKY_MIND Databases page: https://www.notion.so/mood-mnky/MNKY_MIND-Databases-2e1cd2a654228009920ee6fa51188f46
export const NOTION_MNKY_MIND_DATABASE_ID =
  process.env.NOTION_MNKY_MIND_DATABASE_ID ?? "2e1cd2a6-5422-8009-920e-e6fa51188f46"

export const NOTION_DATABASE_IDS = {
  fragranceOils: "2c8cd2a6-5422-813a-8d0f-efdd74a80a6f",
  fragranceNotes: "1e8a4b85-160d-43c2-b6ae-c013744608d7",
  collections: "0abe801a-cd15-4ac1-9f9a-c298d3250ee7",
  products: "a57635f9-276d-4d37-a368-6db6c0a02f8e",
  formulas: "604555f9-db48-43d6-af5d-2e21cc0429b6",
  brandAssets: "e757bb3f-7d8f-4b5f-b380-7a6115751c85",
  productCopy: "998270c2-30c4-4767-a884-e57d28c1adb2",
  customOrders: "120e6471-74a5-4430-abee-2dabfb5ab106",
  docs: "ab8ea6f8-2542-4d45-afc2-bfd9ba31d70e",
  blog: "d5436f86-b687-486e-939f-7223da83cc1d",
} as const

// ---- Types ----

export interface NotionDatabaseInfo {
  id: string
  title: string
  url: string
  propertyCount: number
  lastEditedTime: string
}

export interface NotionPage {
  id: string
  properties: Record<string, NotionProperty>
  created_time: string
  last_edited_time: string
  url: string
}

export interface NotionProperty {
  id: string
  type: string
  title?: Array<{ plain_text: string }>
  rich_text?: Array<{ plain_text: string }>
  number?: number | null
  select?: { name: string; color: string } | null
  multi_select?: Array<{ name: string; color: string }>
  checkbox?: boolean
  url?: string | null
  date?: { start: string; end: string | null } | null
  relation?: Array<{ id: string }>
  formula?: { type: string; string?: string; number?: number; boolean?: boolean }
  rollup?: { type: string; array?: NotionProperty[]; number?: number }
  status?: { name: string; color: string } | null
  email?: string | null
  phone_number?: string | null
  files?: Array<{
    name: string
    type: string
    file?: { url: string }
    external?: { url: string }
  }>
}

interface NotionQueryResponse {
  results: Array<{
    id: string
    properties: Record<string, NotionProperty>
    created_time: string
    last_edited_time: string
    url: string
  }>
  has_more: boolean
  next_cursor: string | null
}

interface NotionDatabaseResponse {
  id: string
  title: Array<{ plain_text: string }>
  url: string
  properties: Record<string, { id: string; type: string }>
  last_edited_time: string
}

// ---- Core API Fetch ----

const NOTION_RATE_LIMIT_RETRY_MS = 2000
const NOTION_RATE_LIMIT_MAX_RETRIES = 5

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function notionFetch<T>(
  endpoint: string,
  options: { method?: string; body?: Record<string, unknown> } = {}
): Promise<T> {
  const { method = "GET", body } = options
  const url = `${NOTION_BASE_URL}${endpoint}`

  const headers: Record<string, string> = {
    Authorization: `Bearer ${NOTION_API_KEY}`,
    "Notion-Version": NOTION_API_VERSION,
    "Content-Type": "application/json",
  }

  let lastError: Error | null = null
  for (let attempt = 0; attempt <= NOTION_RATE_LIMIT_MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    })

    if (res.ok) {
      return res.json() as Promise<T>
    }

    const errorText = await res.text()
    lastError = new Error(`Notion API error (${res.status}): ${errorText}`)

    if (res.status === 429 && attempt < NOTION_RATE_LIMIT_MAX_RETRIES) {
      const retryAfterSec = res.headers.get("Retry-After")
      const waitMs = retryAfterSec
        ? Math.max(1000, parseFloat(retryAfterSec) * 1000)
        : NOTION_RATE_LIMIT_RETRY_MS
      await sleep(waitMs)
      continue
    }

    throw lastError
  }

  throw lastError ?? new Error("Notion API request failed")
}

// ---- Database Methods ----

/** Retrieve a single page by ID (for syncing assistant knowledge from specific pages) */
export async function retrievePage(pageId: string): Promise<NotionPage | null> {
  try {
    const data = await notionFetch<{
      id: string
      properties: Record<string, NotionProperty>
      created_time: string
      last_edited_time: string
      url: string
    }>(`/pages/${pageId}`)
    return {
      id: data.id,
      properties: data.properties,
      created_time: data.created_time,
      last_edited_time: data.last_edited_time,
      url: data.url,
    }
  } catch {
    return null
  }
}

export async function getDatabaseInfo(
  databaseId: string
): Promise<NotionDatabaseInfo> {
  const data = await notionFetch<NotionDatabaseResponse>(
    `/databases/${databaseId}`
  )
  return {
    id: data.id,
    title: data.title.map((t) => t.plain_text).join(""),
    url: data.url,
    propertyCount: Object.keys(data.properties).length,
    lastEditedTime: data.last_edited_time,
  }
}

export async function queryDatabase(
  databaseId: string,
  options: {
    filter?: Record<string, unknown>
    sorts?: Array<Record<string, unknown>>
    startCursor?: string
    pageSize?: number
  } = {}
): Promise<{ pages: NotionPage[]; hasMore: boolean; nextCursor: string | null }> {
  const body: Record<string, unknown> = {}
  if (options.filter) body.filter = options.filter
  if (options.sorts) body.sorts = options.sorts
  if (options.startCursor) body.start_cursor = options.startCursor
  if (options.pageSize) body.page_size = options.pageSize

  const data = await notionFetch<NotionQueryResponse>(
    `/databases/${databaseId}/query`,
    { method: "POST", body }
  )

  return {
    pages: data.results.map((r) => ({
      id: r.id,
      properties: r.properties,
      created_time: r.created_time,
      last_edited_time: r.last_edited_time,
      url: r.url,
    })),
    hasMore: data.has_more,
    nextCursor: data.next_cursor,
  }
}

/** Delay between paginated Notion queries to stay under ~3 req/s */
const NOTION_PAGINATION_DELAY_MS = 350

export async function queryAllPages(
  databaseId: string,
  options: {
    filter?: Record<string, unknown>
    sorts?: Array<Record<string, unknown>>
  } = {}
): Promise<NotionPage[]> {
  const allPages: NotionPage[] = []
  let hasMore = true
  let nextCursor: string | undefined

  while (hasMore) {
    const result = await queryDatabase(databaseId, {
      ...options,
      startCursor: nextCursor,
      pageSize: 100,
    })
    allPages.push(...result.pages)
    hasMore = result.hasMore
    nextCursor = result.nextCursor ?? undefined
    if (hasMore) {
      await sleep(NOTION_PAGINATION_DELAY_MS)
    }
  }

  return allPages
}

// ---- Page Create / Update (for two-way sync) ----

const NOTION_RICH_TEXT_CHUNK_SIZE = 2000

/** Split content into Notion rich_text blocks (max 2000 chars per block) */
export function richTextChunks(content: string): Array<{ text: { content: string } }> {
  if (!content || content.length === 0) return []
  const chunks: Array<{ text: { content: string } }> = []
  for (let i = 0; i < content.length; i += NOTION_RICH_TEXT_CHUNK_SIZE) {
    chunks.push({ text: { content: content.slice(i, i + NOTION_RICH_TEXT_CHUNK_SIZE) } })
  }
  return chunks
}

interface NotionCreatePageResponse {
  id: string
  url: string
}

/** Create a page in a Notion database */
export async function createPageInDatabase(
  databaseId: string,
  properties: Record<string, unknown>
): Promise<{ id: string; url: string }> {
  const data = await notionFetch<NotionCreatePageResponse>("/pages", {
    method: "POST",
    body: {
      parent: { database_id: databaseId },
      properties,
    },
  })
  return { id: data.id, url: data.url }
}

/** Update a Notion page's properties */
export async function updatePageProperties(
  pageId: string,
  properties: Record<string, unknown>
): Promise<void> {
  await notionFetch(`/pages/${pageId}`, {
    method: "PATCH",
    body: { properties },
  })
}

// ---- Manga 2-way sync (Supabase → Notion) ----

/** Build Notion property payload for MNKY Manga Issues "Cover URL" */
export function buildNotionIssueCoverUrlProperty(url: string): Record<string, unknown> {
  return { "Cover URL": { type: "url", url: url || null } }
}

/** Push issue cover URL from Supabase to Notion (2-way sync). Call after uploading cover in LABZ. */
export async function pushMangaIssueCoverToNotion(notionPageId: string, coverUrl: string): Promise<void> {
  if (!isConfigured()) return
  await updatePageProperties(notionPageId, buildNotionIssueCoverUrlProperty(coverUrl))
}

/** Build Notion property payload for MNKY Manga Panels "Asset URL". Use when pushing panel image URL. */
export function buildNotionPanelAssetUrlProperty(url: string): Record<string, unknown> {
  return { "Asset URL": { type: "url", url: url || null } }
}

/** Push panel asset URL to Notion. Call after uploading panel image in LABZ when panel has notion_id. */
export async function pushMangaPanelAssetUrlToNotion(notionPageId: string, assetUrl: string): Promise<void> {
  if (!isConfigured()) return
  await updatePageProperties(notionPageId, buildNotionPanelAssetUrlProperty(assetUrl))
}

/** Params for pushing full issue metadata to MNKY Manga Issues. */
export interface NotionIssueMetadataParams {
  title: string
  slug: string
  status: "draft" | "published"
  arc_summary: string | null
  published_at: string | null
  collection_notion_id?: string | null
}

/** Build Notion property payload for MNKY Manga Issues (Title, Slug, Status, Arc Summary, Published Date, Collection). */
export function buildNotionIssueMetadataProperties(params: NotionIssueMetadataParams): Record<string, unknown> {
  const props: Record<string, unknown> = {
    Title: { type: "title", title: [{ type: "text", text: { content: params.title || "Untitled" } }] },
    Slug: {
      type: "rich_text",
      rich_text: params.slug ? [{ type: "text", text: { content: params.slug } }] : [],
    },
    Status: { type: "select", select: { name: params.status === "published" ? "published" : "draft" } },
    "Arc Summary": {
      type: "rich_text",
      rich_text: params.arc_summary ? [{ type: "text", text: { content: params.arc_summary } }] : [],
    },
    "Published Date": {
      type: "date",
      date: params.published_at
        ? { start: params.published_at.slice(0, 10), end: null }
        : null,
    },
  }
  if (params.collection_notion_id) {
    props.Collection = { type: "relation", relation: [{ id: params.collection_notion_id }] }
  }
  return props
}

/** Push full issue metadata from Supabase to Notion. Call after editing issue in LABZ when issue has notion_id. */
export async function pushMangaIssueMetadataToNotion(
  notionPageId: string,
  params: NotionIssueMetadataParams
): Promise<void> {
  if (!isConfigured()) return
  await updatePageProperties(notionPageId, buildNotionIssueMetadataProperties(params))
}

/** Build Notion property payload for MNKY Manga Collections (Name, Slug). */
export function buildNotionCollectionMetadataProperties(
  name: string,
  slug: string
): Record<string, unknown> {
  return {
    Name: { type: "title", title: [{ type: "text", text: { content: name || "Untitled" } }] },
    Slug: {
      type: "rich_text",
      rich_text: slug ? [{ type: "text", text: { content: slug } }] : [],
    },
  }
}

/** Push collection name/slug to Notion. Call after editing collection in LABZ when collection has notion_id. */
export async function pushMangaCollectionToNotion(
  notionPageId: string,
  name: string,
  slug: string
): Promise<void> {
  if (!isConfigured()) return
  await updatePageProperties(notionPageId, buildNotionCollectionMetadataProperties(name, slug))
}

// ---- App Asset Slots (MNKY_MIND two-way) ----

/** Build Notion property payload for App Asset Slots "Current URL" (or "Asset URL"). */
export function buildNotionAppAssetUrlProperty(url: string): Record<string, unknown> {
  return { "Current URL": { type: "url", url: url || null } }
}

/** Push app asset slot URL to Notion. Call after uploading/replacing in App Assets back office when slot has notion_page_id. */
export async function pushAppAssetSlotUrlToNotion(
  notionPageId: string,
  assetUrl: string
): Promise<void> {
  if (!isConfigured()) return
  await updatePageProperties(notionPageId, buildNotionAppAssetUrlProperty(assetUrl))
}

// ---- Property Extractors ----

export function getTitle(prop: NotionProperty | undefined): string {
  if (!prop?.title) return ""
  return prop.title.map((t) => t.plain_text).join("")
}

export function getRichText(prop: NotionProperty | undefined): string {
  if (!prop?.rich_text) return ""
  return prop.rich_text.map((t) => t.plain_text).join("")
}

export function getNumber(prop: NotionProperty | undefined): number | null {
  if (!prop || prop.type !== "number") return null
  return prop.number ?? null
}

export function getSelect(prop: NotionProperty | undefined): string | null {
  if (!prop?.select) return null
  return prop.select.name
}

export function getMultiSelect(prop: NotionProperty | undefined): string[] {
  if (!prop?.multi_select) return []
  return prop.multi_select.map((s) => s.name)
}

export function getCheckbox(prop: NotionProperty | undefined): boolean {
  if (!prop || prop.type !== "checkbox") return false
  return prop.checkbox ?? false
}

export function getUrl(prop: NotionProperty | undefined): string | null {
  if (!prop || prop.type !== "url") return null
  return prop.url ?? null
}

export function getDate(prop: NotionProperty | undefined): string | null {
  if (!prop?.date) return null
  return prop.date.start ?? null
}

export function getRelationIds(prop: NotionProperty | undefined): string[] {
  if (!prop?.relation) return []
  return prop.relation.map((r) => r.id)
}

export function getStatus(prop: NotionProperty | undefined): string | null {
  if (!prop?.status) return null
  return prop.status.name ?? null
}

export function getFiles(prop: NotionProperty | undefined): string[] {
  if (!prop?.files) return []
  return prop.files
    .map((f) => f.file?.url || f.external?.url || "")
    .filter(Boolean)
}

// ---- Sync Status ----

export interface NotionSyncStatus {
  database: string
  databaseId: string
  totalRecords: number
  lastSynced: string
  status: "synced" | "syncing" | "error" | "idle"
  error?: string
}

// ---- Config Check ----

export function isConfigured(): boolean {
  return Boolean(NOTION_API_KEY)
}

// ---- Update Page ----

export interface FragranceOilUpdate {
  name?: string
  description?: string
  family?: string
  subfamilies?: string[]
  topNotes?: string[]
  middleNotes?: string[]
  baseNotes?: string[]
  type?: string
  alternativeBranding?: string[]
  candleSafe?: boolean
  soapSafe?: boolean
  lotionSafe?: boolean
  perfumeSafe?: boolean
  roomSpraySafe?: boolean
  waxMeltSafe?: boolean
  maxUsageCandle?: number
  maxUsageSoap?: number
  maxUsageLotion?: number
  price1oz?: number
  price4oz?: number
  price16oz?: number
  rating?: number
  reviewCount?: number
  blendsWellWith?: string[]
  suggestedColors?: string[]
  allergenStatement?: string | null
  imageUrl?: string | null
}

interface NotionDatabaseSchema {
  properties: Record<string, { id: string; type: string }>
}

/** Get database schema to discover property names (e.g. title might be "Name" or "Fragrance Name") */
export async function getDatabaseSchema(
  databaseId: string
): Promise<Record<string, { id: string; type: string }>> {
  const data = await notionFetch<NotionDatabaseSchema>(
    `/databases/${databaseId}`
  )
  return data.properties
}

/** Find the title property name in a database schema */
export function getTitlePropertyName(
  schema: Record<string, { id: string; type: string }>
): string | null {
  for (const [name, def] of Object.entries(schema)) {
    if (def.type === "title") return name
  }
  return null
}

/** Resolve property name from schema when multiple names exist (e.g. "Sub Families" | "Subfamilies") */
function resolvePropertyName(
  schema: Record<string, { id: string; type: string }>,
  candidates: string[]
): string {
  for (const c of candidates) {
    if (c in schema) return c
  }
  return candidates[0]
}

/** Update a Notion page with fragrance oil properties. Uses property names from schema. */
export async function updateFragrancePage(
  pageId: string,
  updates: FragranceOilUpdate,
  schema?: Record<string, { id: string; type: string }>
): Promise<void> {
  const properties = schema ?? (await getDatabaseSchema(NOTION_DATABASE_IDS.fragranceOils))
  const titleName = getTitlePropertyName(properties) ?? "Name"

  const body: Record<string, unknown> = {}

  if (updates.name !== undefined) {
    body[titleName] = { title: [{ text: { content: updates.name } }] }
  }
  if (updates.description !== undefined) {
    body["Description"] = { rich_text: [{ text: { content: updates.description } }] }
  }
  if (updates.family !== undefined) {
    body["Family"] = { select: { name: updates.family } }
  }
  if (updates.subfamilies !== undefined) {
    const subFam = resolvePropertyName(properties, ["Sub Families", "Subfamilies"])
    body[subFam] = { multi_select: updates.subfamilies.map((n) => ({ name: n })) }
  }
  if (updates.topNotes !== undefined) {
    body["Top Notes"] = { multi_select: updates.topNotes.map((n) => ({ name: n })) }
  }
  if (updates.middleNotes !== undefined) {
    body["Middle Notes"] = { multi_select: updates.middleNotes.map((n) => ({ name: n })) }
  }
  if (updates.baseNotes !== undefined) {
    body["Base Notes"] = { multi_select: updates.baseNotes.map((n) => ({ name: n })) }
  }
  if (updates.type !== undefined) {
    body["Type"] = { select: { name: updates.type } }
  }
  if (updates.alternativeBranding !== undefined) {
    body["Alternative Branding"] = { multi_select: updates.alternativeBranding.map((n) => ({ name: n })) }
  }
  if (updates.candleSafe !== undefined) {
    body["Candle Safe"] = { checkbox: updates.candleSafe }
  }
  if (updates.soapSafe !== undefined) {
    body["Soap Safe"] = { checkbox: updates.soapSafe }
  }
  if (updates.lotionSafe !== undefined) {
    body["Lotion Safe"] = { checkbox: updates.lotionSafe }
  }
  if (updates.perfumeSafe !== undefined) {
    body["Perfume Safe"] = { checkbox: updates.perfumeSafe }
  }
  if (updates.roomSpraySafe !== undefined) {
    body["Room Spray Safe"] = { checkbox: updates.roomSpraySafe }
  }
  if (updates.waxMeltSafe !== undefined) {
    body["Wax Melt Safe"] = { checkbox: updates.waxMeltSafe }
  }
  if (updates.maxUsageCandle !== undefined) {
    body["Max Usage Candle"] = { number: updates.maxUsageCandle }
  }
  if (updates.maxUsageSoap !== undefined) {
    body["Max Usage Soap"] = { number: updates.maxUsageSoap }
  }
  if (updates.maxUsageLotion !== undefined) {
    body["Max Usage Lotion"] = { number: updates.maxUsageLotion }
  }
  if (updates.price1oz !== undefined) {
    body["Price 1oz"] = { number: updates.price1oz }
  }
  if (updates.price4oz !== undefined) {
    body["Price 4oz"] = { number: updates.price4oz }
  }
  if (updates.price16oz !== undefined) {
    body["Price 16oz"] = { number: updates.price16oz }
  }
  if (updates.rating !== undefined) {
    body["Rating"] = { number: updates.rating }
  }
  if (updates.reviewCount !== undefined) {
    body["Review Count"] = { number: updates.reviewCount }
  }
  if (updates.blendsWellWith !== undefined) {
    body["Blends Well With"] = { multi_select: updates.blendsWellWith.map((n) => ({ name: n })) }
  }
  if (updates.suggestedColors !== undefined) {
    body["Suggested Colors"] = { multi_select: updates.suggestedColors.map((n) => ({ name: n })) }
  }
  if (updates.allergenStatement !== undefined) {
    body["Allergen Statement"] = updates.allergenStatement
      ? { url: updates.allergenStatement }
      : { url: null }
  }
  if (updates.imageUrl !== undefined) {
    const imageUrlProp = resolvePropertyName(properties, ["Image URL", "Image", "Product Image URL"])
    body[imageUrlProp] = updates.imageUrl ? { url: updates.imageUrl } : { url: null }
  }

  if (Object.keys(body).length === 0) return

  await notionFetch(`/pages/${pageId}`, { method: "PATCH", body: { properties: body } })
}
