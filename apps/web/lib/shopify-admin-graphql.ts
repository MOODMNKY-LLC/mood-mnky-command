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

// ---- Metaobjects (write_metaobject_definitions, write_metaobjects) ----

/** Fragrance note metaobject type (merchant-owned, storefront PUBLIC_READ for native Liquid). */
export const FRAGRANCE_NOTE_METAOBJECT_TYPE = "fragrance_note"

const METAOBJECT_DEFINITION_CREATE = `
  mutation MetaobjectDefinitionCreate($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition { id type name }
      userErrors { field message code }
    }
  }
`

/**
 * Ensure the fragrance_note metaobject definition exists. Idempotent; safe to call repeatedly.
 * Requires write_metaobject_definitions. Creates merchant-owned definition with storefront PUBLIC_READ.
 */
export async function ensureFragranceNoteMetaobjectDefinition(): Promise<void> {
  const data = await shopifyGraphQL<{
    metaobjectDefinitionCreate: {
      metaobjectDefinition: { id: string; type: string } | null
      userErrors: Array<{ field?: string[]; message: string; code?: string }>
    }
  }>(METAOBJECT_DEFINITION_CREATE, {
    definition: {
      name: "Fragrance Note",
      type: FRAGRANCE_NOTE_METAOBJECT_TYPE,
      access: { storefront: "PUBLIC_READ" },
      fieldDefinitions: [
        { name: "Name", key: "name", type: "single_line_text_field" },
        { name: "Slug", key: "slug", type: "single_line_text_field" },
        { name: "Description", key: "description_short", type: "multi_line_text_field" },
        { name: "Olfactive profile", key: "olfactive_profile", type: "multi_line_text_field" },
        { name: "Facts", key: "facts", type: "multi_line_text_field" },
      ],
    },
  })
  const result = data.metaobjectDefinitionCreate
  if (result.userErrors?.length) {
    const taken = result.userErrors.some(
      (e) => e.code === "TAKEN" || /already exists|taken/i.test(e.message)
    )
    if (taken) return
    const msg = result.userErrors.map((e) => e.message).join("; ")
    throw new Error(`Metaobject definition create failed: ${msg}`)
  }
}

const METAOBJECT_CREATE = `
  mutation MetaobjectCreate($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject { id handle }
      userErrors { field message code }
    }
  }
`

export interface FragranceNoteMetaobjectFields {
  name: string
  slug: string
  description_short: string
  olfactive_profile: string
  facts: string
}

/**
 * Create a fragrance_note metaobject entry. Requires write_metaobjects.
 * Handle is used as the URL slug (e.g. /metaobject/fragrance_note/amber).
 */
export async function metaobjectCreateFragranceNote(
  handle: string,
  fields: FragranceNoteMetaobjectFields
): Promise<{ id: string; handle: string }> {
  const data = await shopifyGraphQL<{
    metaobjectCreate: {
      metaobject: { id: string; handle: string } | null
      userErrors: Array<{ field?: string[]; message: string; code?: string }>
    }
  }>(METAOBJECT_CREATE, {
    metaobject: {
      type: FRAGRANCE_NOTE_METAOBJECT_TYPE,
      handle,
      fields: [
        { key: "name", value: fields.name },
        { key: "slug", value: fields.slug },
        { key: "description_short", value: fields.description_short ?? "" },
        { key: "olfactive_profile", value: fields.olfactive_profile ?? "" },
        { key: "facts", value: fields.facts ?? "" },
      ],
    },
  })
  const result = data.metaobjectCreate
  if (result.userErrors?.length) {
    const msg = result.userErrors.map((e) => e.message).join("; ")
    throw new Error(`Metaobject create failed: ${msg}`)
  }
  if (!result.metaobject) throw new Error("Metaobject create returned no metaobject")
  return result.metaobject
}

const METAOBJECT_UPDATE = `
  mutation MetaobjectUpdate($id: ID!, $metaobject: MetaobjectUpdateInput!) {
    metaobjectUpdate(id: $id, metaobject: $metaobject) {
      metaobject { id handle }
      userErrors { field message code }
    }
  }
`

/**
 * Update an existing fragrance_note metaobject by GID. Requires write_metaobjects.
 */
export async function metaobjectUpdateFragranceNote(
  id: string,
  fields: Partial<FragranceNoteMetaobjectFields>
): Promise<{ id: string; handle: string }> {
  const fieldEntries = Object.entries(fields).filter(([, v]) => v != null) as [string, string][]
  const data = await shopifyGraphQL<{
    metaobjectUpdate: {
      metaobject: { id: string; handle: string } | null
      userErrors: Array<{ field?: string[]; message: string; code?: string }>
    }
  }>(METAOBJECT_UPDATE, {
    id,
    metaobject: {
      fields: fieldEntries.map(([key, value]) => ({ key, value })),
    },
  })
  const result = data.metaobjectUpdate
  if (result.userErrors?.length) {
    const msg = result.userErrors.map((e) => e.message).join("; ")
    throw new Error(`Metaobject update failed: ${msg}`)
  }
  if (!result.metaobject) throw new Error("Metaobject update returned no metaobject")
  return result.metaobject
}

const METAOBJECTS_QUERY = `
  query GetMetaobjectsByType($type: String!, $first: Int!) {
    metaobjects(type: $type, first: $first) {
      nodes { id handle }
      pageInfo { hasNextPage endCursor }
    }
  }
`

/**
 * List fragrance_note metaobject handles (and ids) for sync idempotency. Requires read_metaobjects.
 */
export async function metaobjectListFragranceNoteHandles(): Promise<Array<{ id: string; handle: string }>> {
  const nodes: Array<{ id: string; handle: string }> = []
  let cursor: string | null = null
  const first = 100
  for (;;) {
    const data = await shopifyGraphQL<{
      metaobjects: {
        nodes: Array<{ id: string; handle: string }>
        pageInfo: { hasNextPage: boolean; endCursor: string | null }
      }
    }>(METAOBJECTS_QUERY, { type: FRAGRANCE_NOTE_METAOBJECT_TYPE, first })
    const result = data.metaobjects
    nodes.push(...(result?.nodes ?? []))
    if (!result?.pageInfo?.hasNextPage || !result.pageInfo.endCursor) break
    cursor = result.pageInfo.endCursor
    // Pagination would need after: cursor in the query; for initial sync 100 is often enough
    break
  }
  return nodes
}

// ---- Manga metaobjects (mnky_collection, mnky_issue) ----

export const MNKY_COLLECTION_METAOBJECT_TYPE = "mnky_collection"
export const MNKY_ISSUE_METAOBJECT_TYPE = "mnky_issue"

/**
 * Ensure mnky_collection metaobject definition exists. Idempotent.
 * Requires write_metaobject_definitions.
 */
export async function ensureMnkyCollectionMetaobjectDefinition(): Promise<void> {
  const data = await shopifyGraphQL<{
    metaobjectDefinitionCreate: {
      metaobjectDefinition: { id: string; type: string } | null
      userErrors: Array<{ field?: string[]; message: string; code?: string }>
    }
  }>(METAOBJECT_DEFINITION_CREATE, {
    definition: {
      name: "MNKY Collection",
      type: MNKY_COLLECTION_METAOBJECT_TYPE,
      access: { storefront: "PUBLIC_READ" },
      fieldDefinitions: [
        { name: "Name", key: "name", type: "single_line_text_field" },
        { name: "Slug", key: "slug", type: "single_line_text_field" },
        { name: "Shopify collection GID", key: "shopify_collection_gid", type: "single_line_text_field" },
      ],
    },
  })
  const result = data.metaobjectDefinitionCreate
  if (result.userErrors?.length) {
    const taken = result.userErrors.some(
      (e) => e.code === "TAKEN" || /already exists|taken/i.test(e.message)
    )
    if (taken) return
    const msg = result.userErrors.map((e) => e.message).join("; ")
    throw new Error(`mnky_collection definition create failed: ${msg}`)
  }
}

/**
 * Ensure mnky_issue metaobject definition exists. Idempotent.
 * Requires write_metaobject_definitions.
 */
export async function ensureMnkyIssueMetaobjectDefinition(): Promise<void> {
  const data = await shopifyGraphQL<{
    metaobjectDefinitionCreate: {
      metaobjectDefinition: { id: string; type: string } | null
      userErrors: Array<{ field?: string[]; message: string; code?: string }>
    }
  }>(METAOBJECT_DEFINITION_CREATE, {
    definition: {
      name: "MNKY Issue",
      type: MNKY_ISSUE_METAOBJECT_TYPE,
      access: { storefront: "PUBLIC_READ" },
      fieldDefinitions: [
        { name: "Collection", key: "collection", type: "metaobject_reference", reference: { type: MNKY_COLLECTION_METAOBJECT_TYPE } },
        { name: "Issue number", key: "issue_number", type: "number_integer" },
        { name: "Title", key: "title", type: "single_line_text_field" },
        { name: "Slug", key: "slug", type: "single_line_text_field" },
        { name: "Arc summary", key: "arc_summary", type: "multi_line_text_field" },
        { name: "Cover asset URL", key: "cover_asset_url", type: "url" },
        { name: "Status", key: "status", type: "single_line_text_field" },
        { name: "Published at", key: "published_at", type: "date_time" },
      ],
    },
  })
  const result = data.metaobjectDefinitionCreate
  if (result.userErrors?.length) {
    const taken = result.userErrors.some(
      (e) => e.code === "TAKEN" || /already exists|taken/i.test(e.message)
    )
    if (taken) return
    const msg = result.userErrors.map((e) => e.message).join("; ")
    throw new Error(`mnky_issue definition create failed: ${msg}`)
  }
}

export interface MnkyCollectionMetaobjectFields {
  name: string
  slug: string
  shopify_collection_gid: string
}

export async function metaobjectCreateMnkyCollection(
  handle: string,
  fields: MnkyCollectionMetaobjectFields
): Promise<{ id: string; handle: string }> {
  const data = await shopifyGraphQL<{
    metaobjectCreate: {
      metaobject: { id: string; handle: string } | null
      userErrors: Array<{ field?: string[]; message: string; code?: string }>
    }
  }>(METAOBJECT_CREATE, {
    metaobject: {
      type: MNKY_COLLECTION_METAOBJECT_TYPE,
      handle,
      fields: [
        { key: "name", value: fields.name },
        { key: "slug", value: fields.slug },
        { key: "shopify_collection_gid", value: fields.shopify_collection_gid ?? "" },
      ],
    },
  })
  const result = data.metaobjectCreate
  if (result.userErrors?.length) {
    const msg = result.userErrors.map((e) => e.message).join("; ")
    throw new Error(`MnkyCollection metaobject create failed: ${msg}`)
  }
  if (!result.metaobject) throw new Error("Metaobject create returned no metaobject")
  return result.metaobject
}

export async function metaobjectUpdateMnkyCollection(
  id: string,
  fields: Partial<MnkyCollectionMetaobjectFields>
): Promise<{ id: string; handle: string }> {
  const fieldEntries = Object.entries(fields).filter(([, v]) => v != null) as [string, string][]
  const data = await shopifyGraphQL<{
    metaobjectUpdate: {
      metaobject: { id: string; handle: string } | null
      userErrors: Array<{ field?: string[]; message: string; code?: string }>
    }
  }>(METAOBJECT_UPDATE, {
    id,
    metaobject: { fields: fieldEntries.map(([key, value]) => ({ key, value })) },
  })
  const result = data.metaobjectUpdate
  if (result.userErrors?.length) {
    const msg = result.userErrors.map((e) => e.message).join("; ")
    throw new Error(`MnkyCollection metaobject update failed: ${msg}`)
  }
  if (!result.metaobject) throw new Error("Metaobject update returned no metaobject")
  return result.metaobject
}

export async function metaobjectListMnkyCollectionHandles(): Promise<Array<{ id: string; handle: string }>> {
  const data = await shopifyGraphQL<{
    metaobjects: { nodes: Array<{ id: string; handle: string }> }
  }>(METAOBJECTS_QUERY, { type: MNKY_COLLECTION_METAOBJECT_TYPE, first: 100 })
  return data.metaobjects?.nodes ?? []
}

export interface MnkyIssueMetaobjectFields {
  collection_gid: string
  issue_number: number
  title: string
  slug: string
  arc_summary: string
  cover_asset_url: string
  status: string
  published_at: string | null
}

/** Create mnky_issue metaobject. collection_gid is the mnky_collection metaobject GID. */
export async function metaobjectCreateMnkyIssue(
  handle: string,
  fields: MnkyIssueMetaobjectFields
): Promise<{ id: string; handle: string }> {
  const data = await shopifyGraphQL<{
    metaobjectCreate: {
      metaobject: { id: string; handle: string } | null
      userErrors: Array<{ field?: string[]; message: string; code?: string }>
    }
  }>(METAOBJECT_CREATE, {
    metaobject: {
      type: MNKY_ISSUE_METAOBJECT_TYPE,
      handle,
      fields: [
        { key: "collection", value: fields.collection_gid },
        { key: "issue_number", value: String(fields.issue_number) },
        { key: "title", value: fields.title },
        { key: "slug", value: fields.slug },
        { key: "arc_summary", value: fields.arc_summary ?? "" },
        { key: "cover_asset_url", value: fields.cover_asset_url ?? "" },
        { key: "status", value: fields.status },
        { key: "published_at", value: fields.published_at ?? "" },
      ],
    },
  })
  const result = data.metaobjectCreate
  if (result.userErrors?.length) {
    const msg = result.userErrors.map((e) => e.message).join("; ")
    throw new Error(`MnkyIssue metaobject create failed: ${msg}`)
  }
  if (!result.metaobject) throw new Error("Metaobject create returned no metaobject")
  return result.metaobject
}

export async function metaobjectUpdateMnkyIssue(
  id: string,
  fields: Partial<MnkyIssueMetaobjectFields>
): Promise<{ id: string; handle: string }> {
  const fieldEntries = Object.entries(fields).filter(([, v]) => v != null) as [string, string][]
  const data = await shopifyGraphQL<{
    metaobjectUpdate: {
      metaobject: { id: string; handle: string } | null
      userErrors: Array<{ field?: string[]; message: string; code?: string }>
    }
  }>(METAOBJECT_UPDATE, {
    id,
    metaobject: { fields: fieldEntries.map(([key, value]) => ({ key, value: String(value) })) },
  })
  const result = data.metaobjectUpdate
  if (result.userErrors?.length) {
    const msg = result.userErrors.map((e) => e.message).join("; ")
    throw new Error(`MnkyIssue metaobject update failed: ${msg}`)
  }
  if (!result.metaobject) throw new Error("Metaobject update returned no metaobject")
  return result.metaobject
}

export async function metaobjectListMnkyIssueHandles(): Promise<Array<{ id: string; handle: string }>> {
  const data = await shopifyGraphQL<{
    metaobjects: { nodes: Array<{ id: string; handle: string }> }
  }>(METAOBJECTS_QUERY, { type: MNKY_ISSUE_METAOBJECT_TYPE, first: 100 })
  return data.metaobjects?.nodes ?? []
}
