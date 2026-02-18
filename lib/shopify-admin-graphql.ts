/**
 * Shopify Admin API GraphQL client for page, menu, and theme operations.
 * Uses SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN.
 * Scopes: write_content or write_online_store_pages (pageCreate);
 * read_online_store_navigation / write_online_store_navigation (menus);
 * read_themes (theme list/files), write_themes (themeFilesUpsert).
 */

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || ""
const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN || ""
const API_VERSION = "2024-10"

const GRAPHQL_URL = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`

export function isShopifyGraphQLConfigured(): boolean {
  return Boolean(SHOPIFY_STORE_DOMAIN && SHOPIFY_ADMIN_API_TOKEN)
}

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{ message: string; locations?: unknown; path?: unknown }>
}

async function shopifyGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Shopify GraphQL error (${res.status}): ${text}`)
  }

  const json = (await res.json()) as GraphQLResponse<T>
  if (json.errors?.length) {
    const msg = json.errors.map((e) => e.message).join("; ")
    throw new Error(`Shopify GraphQL errors: ${msg}`)
  }

  if (json.data == null) {
    throw new Error("Shopify GraphQL returned no data")
  }

  return json.data
}

// ---- Page Create ----

export interface PageCreateInput {
  title: string
  handle?: string | null
  body?: string | null
  templateSuffix?: string | null
  isPublished?: boolean
}

export interface PageCreateResult {
  id: string
  title: string
  handle: string
}

const PAGE_CREATE_MUTATION = `
  mutation PageCreate($page: PageCreateInput!) {
    pageCreate(page: $page) {
      page {
        id
        title
        handle
      }
      userErrors {
        code
        field
        message
      }
    }
  }
`

export async function pageCreate(input: PageCreateInput): Promise<PageCreateResult> {
  const variables = {
    page: {
      title: input.title,
      handle: input.handle ?? undefined,
      body: input.body ?? undefined,
      templateSuffix: input.templateSuffix ?? undefined,
      isPublished: input.isPublished !== false,
    },
  }

  const data = await shopifyGraphQL<{
    pageCreate: {
      page: PageCreateResult | null
      userErrors: Array<{ code?: string; field?: string[]; message: string }>
    }
  }>(PAGE_CREATE_MUTATION, variables)

  const { pageCreate: result } = data
  if (result.userErrors?.length) {
    const msg = result.userErrors.map((e) => e.message).join("; ")
    throw new Error(`Page create failed: ${msg}`)
  }

  if (!result.page) {
    throw new Error("Page create returned no page")
  }

  return result.page
}

// ---- Page Update ----

export interface PageUpdateInput {
  title?: string | null
  handle?: string | null
  body?: string | null
  templateSuffix?: string | null
  isPublished?: boolean
}

const PAGE_UPDATE_MUTATION = `
  mutation PageUpdate($id: ID!, $page: PageUpdateInput!) {
    pageUpdate(id: $id, page: $page) {
      page {
        id
        title
        handle
        body
      }
      userErrors {
        code
        field
        message
      }
    }
  }
`

/** Update an existing page. id is numeric (REST) or GID; will be converted to GID if number. */
export async function pageUpdate(
  id: string | number,
  input: PageUpdateInput
): Promise<PageCreateResult & { body?: string | null }> {
  const gid = typeof id === "number" ? `gid://shopify/Page/${id}` : id
  const variables = {
    id: gid,
    page: {
      title: input.title ?? undefined,
      handle: input.handle ?? undefined,
      body: input.body ?? undefined,
      templateSuffix: input.templateSuffix ?? undefined,
      isPublished: input.isPublished,
    },
  }
  const data = await shopifyGraphQL<{
    pageUpdate: {
      page: (PageCreateResult & { body?: string | null }) | null
      userErrors: Array<{ code?: string; field?: string[]; message: string }>
    }
  }>(PAGE_UPDATE_MUTATION, variables)
  const result = data.pageUpdate
  if (result.userErrors?.length) {
    const msg = result.userErrors.map((e) => e.message).join("; ")
    throw new Error(`Page update failed: ${msg}`)
  }
  if (!result.page) {
    throw new Error("Page update returned no page")
  }
  return result.page
}

// ---- Menu (optional helpers for MNKY LABZ nav) ----

export interface MenuItem {
  id: string
  title: string
  type: string
  url?: string | null
  resourceId?: string | null
  items?: MenuItem[]
}

export interface Menu {
  id: string
  handle: string
  title: string
  itemsCount: number
  items: MenuItem[]
}

const MENU_QUERY = `
  query GetMenus($query: String!) {
    menus(first: 10, query: $query) {
      nodes {
        id
        handle
        title
        itemsCount
        items {
          id
          title
          type
          url
          resourceId
          items {
            id
            title
            type
            url
            resourceId
          }
        }
      }
    }
  }
`

/**
 * Get a menu by handle (e.g. "main-menu"). Returns the first matching menu or null.
 */
export async function menuGetByHandle(handle: string): Promise<Menu | null> {
  const data = await shopifyGraphQL<{
    menus: { nodes: Array<{
      id: string
      handle: string
      title: string
      itemsCount: number
      items: MenuItem[]
    }> }
  }>(MENU_QUERY, { query: `handle:${handle}` })

  const node = data.menus?.nodes?.[0]
  if (!node) return null

  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    itemsCount: node.itemsCount,
    items: node.items ?? [],
  }
}

// ---- Theme & page templates (read_themes, write_themes) ----

export interface ThemeInfo {
  id: string
  name: string
  role: string
}

const THEMES_QUERY = `
  query Themes($first: Int!, $roles: [ThemeRole!]) {
    themes(first: $first, roles: $roles) {
      nodes {
        id
        name
        role
      }
    }
  }
`

/** List themes, optionally filtered by role (e.g. ["MAIN"]). Requires read_themes. */
export async function themesList(roles?: string[]): Promise<ThemeInfo[]> {
  const roleEnum =
    roles?.length ?
      (roles.map((r) => r.toUpperCase()) as ("MAIN" | "UNPUBLISHED" | "DEVELOPMENT" | "DEMO" | "LOCKED" | "ARCHIVED")[])
    : null
  const data = await shopifyGraphQL<{ themes: { nodes: ThemeInfo[] } }>(
    THEMES_QUERY,
    roleEnum ? { first: 20, roles: roleEnum } : { first: 20 }
  )
  return data.themes?.nodes ?? []
}

const THEME_FILES_QUERY = `
  query ThemeFiles($themeId: ID!, $first: Int!) {
    theme(id: $themeId) {
      id
      files(first: $first) {
        edges {
          node {
            filename
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`

/** Fetch theme files (paginated). Use themeGetPageTemplateSuffixes for page templates only. */
export async function themeGetFileNames(themeId: string, first = 500): Promise<string[]> {
  const filenames: string[] = []
  let cursor: string | null = null
  for (;;) {
    const data = await shopifyGraphQL<{
      theme: {
        files: {
          edges: Array<{ node: { filename: string } }>
          pageInfo: { hasNextPage: boolean; endCursor: string | null }
        }
      }
    }>(THEME_FILES_QUERY, { themeId, first })
    const edges = data.theme?.files?.edges ?? []
    for (const e of edges) {
      filenames.push(e.node.filename)
    }
    const pageInfo = data.theme?.files?.pageInfo
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor) break
    cursor = pageInfo.endCursor
    // Next page would need after: cursor - we'd need to add that to the query for full pagination
    break
  }
  return filenames
}

/** Page template filename pattern: templates/page.{suffix}.json (or templates/page.json for default). */
const PAGE_TEMPLATE_REGEX = /^templates\/page\.(.+)\.json$/

/** Get page template suffixes from the theme (e.g. ["fragrance-wheel", "empty"]). Requires read_themes. */
export async function themeGetPageTemplateSuffixes(themeId: string): Promise<string[]> {
  const filenames = await themeGetFileNames(themeId)
  const suffixes = new Set<string>()
  for (const f of filenames) {
    if (f === "templates/page.json") continue
    const m = f.match(PAGE_TEMPLATE_REGEX)
    if (m) suffixes.add(m[1])
  }
  return Array.from(suffixes).sort()
}

const THEME_FILES_UPSERT_MUTATION = `
  mutation ThemeFilesUpsert($themeId: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
    themeFilesUpsert(themeId: $themeId, files: $files) {
      upsertedThemeFiles {
        filename
        size
        createdAt
        updatedAt
      }
      userErrors {
        code
        message
        filename
      }
    }
  }
`

/** Upload or update a single theme file (e.g. templates/page.fragrance-wheel.json). Requires write_themes. */
export async function themeFileUpsert(
  themeId: string,
  filename: string,
  content: string
): Promise<{ filename: string; size: string }> {
  const data = await shopifyGraphQL<{
    themeFilesUpsert: {
      upsertedThemeFiles: Array<{ filename: string; size: string }>
      userErrors: Array<{ code?: string; message: string; filename?: string }>
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }>(THEME_FILES_UPSERT_MUTATION, {
    themeId,
    files: [{ filename, body: { type: "TEXT", value: content } }],
  })
  const result = data.themeFilesUpsert
  if (result.userErrors?.length) {
    const msg = result.userErrors.map((e) => `${e.filename ?? ""}: ${e.message}`).join("; ")
    throw new Error(`Theme file upsert failed: ${msg}`)
  }
  const file = result.upsertedThemeFiles?.[0]
  if (!file) throw new Error("Theme file upsert returned no file")
  return file
}
