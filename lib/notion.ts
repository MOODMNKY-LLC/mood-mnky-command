const NOTION_API_KEY = process.env.NOTION_API_KEY || ""
const NOTION_API_VERSION = "2022-06-28"
const NOTION_BASE_URL = "https://api.notion.com/v1"

// ---- MNKY_MIND Database IDs ----
export const NOTION_DATABASE_IDS = {
  fragranceOils: "2c8cd2a6-5422-813a-8d0f-efdd74a80a6f",
  collections: "0abe801a-cd15-4ac1-9f9a-c298d3250ee7",
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

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Notion API error (${res.status}): ${errorText}`)
  }

  return res.json() as Promise<T>
}

// ---- Database Methods ----

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
  }

  return allPages
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
