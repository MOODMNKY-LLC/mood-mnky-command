import { tool } from "ai"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { getPageCount, getPages, isConfigured as shopifyConfigured } from "@/lib/shopify"
import { getDatabaseInfo, NOTION_DATABASE_IDS, isConfigured as notionConfigured } from "@/lib/notion"

const LABZ_SECTIONS = [
  { label: "Dashboard", href: "/" },
  { label: "Formulas", href: "/formulas" },
  { label: "Fragrance Oils", href: "/fragrances" },
  { label: "Glossary", href: "/glossary" },
  { label: "Blending Lab", href: "/blending" },
  { label: "Wicks & Wax", href: "/wicks" },
  { label: "Product Builder", href: "/products" },
  { label: "MNKY LABZ Pages", href: "/store/labz-pages" },
  { label: "Notion Sync", href: "/notion" },
] as const

/**
 * List formulas from Supabase (id, name, category, created_at).
 */
export const listFormulasTool = tool({
  description: "List formulas from the lab. Use when the user asks how many formulas exist or wants to see formula names/categories.",
  inputSchema: z.object({
    limit: z.number().min(1).max(50).default(10).optional(),
  }),
  execute: async ({ limit = 10 }) => {
    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from("formulas")
        .select("id, name, category, created_at")
        .order("created_at", { ascending: false })
        .limit(limit)
      if (error) return { error: error.message, formulas: [] }
      return { formulas: data ?? [], count: (data ?? []).length }
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to list formulas", formulas: [] }
    }
  },
})

/**
 * List fragrance oils from Supabase (id, name, brand, updated_at).
 */
export const listFragranceOilsTool = tool({
  description: "List fragrance oils from the catalog (synced from Notion). Use when the user asks about oils or fragrance catalog.",
  inputSchema: z.object({
    limit: z.number().min(1).max(50).default(10).optional(),
  }),
  execute: async ({ limit = 10 }) => {
    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from("fragrance_oils")
        .select("id, name, brand, updated_at")
        .order("updated_at", { ascending: false })
        .limit(limit)
      if (error) return { error: error.message, oils: [] }
      return { oils: data ?? [], count: (data ?? []).length }
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to list fragrance oils", oils: [] }
    }
  },
})

/**
 * Search glossary (fragrance_notes) by name or description.
 */
export const searchGlossaryTool = tool({
  description: "Search the fragrance glossary (notes) by name or keyword. Use when the user asks about a specific note or term.",
  inputSchema: z.object({
    query: z.string().describe("Search term (e.g. 'vanilla', 'oud')"),
    limit: z.number().min(1).max(20).default(10).optional(),
  }),
  execute: async ({ query, limit = 10 }) => {
    try {
      const supabase = createAdminClient()
      const q = `%${query}%`
      const { data, error } = await supabase
        .from("fragrance_notes")
        .select("id, name, slug, description")
        .or(`name.ilike.${q},description.ilike.${q}`)
        .limit(limit)
      if (error) return { error: error.message, notes: [] }
      return { notes: data ?? [], count: (data ?? []).length }
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to search glossary", notes: [] }
    }
  },
})

/**
 * Get LABZ pages summary (count and optional titles from Shopify).
 */
export const getLabzPagesSummaryTool = tool({
  description: "Get the count and optional list of MNKY LABZ pages on the Shopify store. Use when the user asks how many MNKY LABZ pages exist or what pages are on the store.",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      if (!shopifyConfigured()) return { connected: false, count: 0, error: "Shopify not configured" }
      const count = await getPageCount()
      const pages = await getPages({ limit: 10 })
      const titles = pages.map((p) => ({ title: p.title, handle: p.handle }))
      return { connected: true, count, sampleTitles: titles }
    } catch (err) {
      return { connected: false, count: 0, error: err instanceof Error ? err.message : "Failed to fetch pages" }
    }
  },
})

/**
 * Return Notion sync connection status.
 */
export const notionSyncStatusTool = tool({
  description: "Check whether Notion is connected and optionally which databases are used. Use when the user asks about sync status or Notion connection.",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      const configured = notionConfigured()
      if (!configured) return { connected: false, message: "Notion is not configured (missing API key)." }
      try {
        await getDatabaseInfo(NOTION_DATABASE_IDS.fragranceOils)
        return { connected: true, message: "Notion is connected; fragrance oils database is reachable." }
      } catch {
        return { connected: false, message: "Notion API key is set but database is not reachable." }
      }
    } catch (err) {
      return { connected: false, message: err instanceof Error ? err.message : "Unknown error" }
    }
  },
})

/**
 * Return deep links to LABZ sections so the assistant can suggest "Open Formulas" etc.
 */
export const openLabzSectionTool = tool({
  description: "Get links to MNKY LABZ sections (Dashboard, Formulas, Fragrance Oils, Glossary, Blending Lab, MNKY LABZ Pages, Notion Sync). Use when the user wants to open a specific part of the app.",
  inputSchema: z.object({
    section: z.enum(["dashboard", "formulas", "fragrances", "glossary", "blending", "wicks", "products", "labz_pages", "notion"]).optional(),
  }),
  execute: async ({ section }) => {
    if (section) {
      const map: Record<string, { label: string; href: string }> = {
        dashboard: { label: "Dashboard", href: "/" },
        formulas: { label: "Formulas", href: "/formulas" },
        fragrances: { label: "Fragrance Oils", href: "/fragrances" },
        glossary: { label: "Glossary", href: "/glossary" },
        blending: { label: "Blending Lab", href: "/blending" },
        wicks: { label: "Wicks & Wax", href: "/wicks" },
        products: { label: "Product Builder", href: "/products" },
        labz_pages: { label: "MNKY LABZ Pages", href: "/store/labz-pages" },
        notion: { label: "Notion Sync", href: "/notion" },
      }
      return { section: map[section] ?? null, allSections: LABZ_SECTIONS }
    }
    return { allSections: LABZ_SECTIONS }
  },
})

export const labzTools = {
  list_formulas: listFormulasTool,
  list_fragrance_oils: listFragranceOilsTool,
  search_glossary: searchGlossaryTool,
  get_labz_pages_summary: getLabzPagesSummaryTool,
  notion_sync_status: notionSyncStatusTool,
  open_labz_section: openLabzSectionTool,
}
