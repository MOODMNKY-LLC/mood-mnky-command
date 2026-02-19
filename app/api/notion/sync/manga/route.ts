import { NextRequest, NextResponse } from "next/server"
import {
  queryAllPages,
  isConfigured,
  getTitle,
  getRichText,
  getSelect,
  getUrl,
  getNumber,
  getDate,
  getRelationIds,
} from "@/lib/notion"
import { requireInternalApiKey } from "@/lib/api/internal-auth"
import { createClient } from "@/lib/supabase/server"
import type { NotionPage } from "@/lib/notion"
import { createAdminClient } from "@/lib/supabase/admin"

const NOTION_RATE_LIMIT_MS = 400

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

const NOTION_MNKY_COLLECTIONS_DB = process.env.NOTION_MNKY_COLLECTIONS_DATABASE_ID ?? ""
const NOTION_MNKY_ISSUES_DB = process.env.NOTION_MNKY_ISSUES_DATABASE_ID ?? ""
const NOTION_MNKY_CHAPTERS_DB = process.env.NOTION_MNKY_CHAPTERS_DATABASE_ID ?? ""
const NOTION_MNKY_PANELS_DB = process.env.NOTION_MNKY_PANELS_DATABASE_ID ?? ""
const NOTION_MNKY_HOTSPOTS_DB = process.env.NOTION_MNKY_HOTSPOTS_DATABASE_ID ?? ""

function getProp(p: NotionPage["properties"], ...keys: string[]) {
  for (const k of keys) {
    const v = p[k]
    if (v) return v
  }
  return undefined
}

/** Require MOODMNKY_API_KEY (Bearer) or authenticated admin. */
async function requireMangaSyncAuth(request: NextRequest): Promise<boolean> {
  if (requireInternalApiKey(request)) return true
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.rpc("is_admin")
  return data === true
}

export async function POST(request: NextRequest) {
  if (!(await requireMangaSyncAuth(request))) {
    return NextResponse.json({ error: "Unauthorized. Use MOODMNKY_API_KEY or admin session." }, { status: 401 })
  }

  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Notion is not configured. Set NOTION_API_KEY." },
      { status: 503 }
    )
  }

  if (!NOTION_MNKY_COLLECTIONS_DB || !NOTION_MNKY_ISSUES_DB) {
    return NextResponse.json(
      {
        error: "Manga Notion databases not configured. Set NOTION_MNKY_COLLECTIONS_DATABASE_ID and NOTION_MNKY_ISSUES_DATABASE_ID.",
      },
      { status: 503 }
    )
  }

  const supabase = createAdminClient()
  const collectionIdByNotionId: Record<string, string> = {}
  const issueIdByNotionId: Record<string, string> = {}
  const chapterIdByNotionId: Record<string, string> = {}
  const panelIdByNotionId: Record<string, string> = {}
  let collectionsSynced = 0
  let issuesSynced = 0
  let chaptersSynced = 0
  let panelsSynced = 0
  let hotspotsSynced = 0

  try {
    const collections = await queryAllPages(NOTION_MNKY_COLLECTIONS_DB)
    for (const p of collections) {
      const props = p.properties
      const name = getTitle(getProp(props, "Name", "Title") as NotionPage["properties"][string]) || "Untitled"
      const slug = getRichText(getProp(props, "Slug") as NotionPage["properties"][string])?.trim() || slugify(name)
      if (!slug) continue

      const { data: byNotion } = await supabase
        .from("mnky_collections")
        .select("id")
        .eq("notion_id", p.id)
        .maybeSingle()
      const { data: bySlug } = !byNotion
        ? await supabase.from("mnky_collections").select("id").eq("slug", slug).maybeSingle()
        : { data: null }

      const existingId = byNotion?.id ?? bySlug?.id
      const row = { name, slug, notion_id: p.id }

      if (existingId) {
        await supabase.from("mnky_collections").update(row).eq("id", existingId)
        collectionIdByNotionId[p.id] = existingId
      } else {
        const { data: inserted } = await supabase.from("mnky_collections").insert(row).select("id").single()
        if (inserted) collectionIdByNotionId[p.id] = inserted.id
      }
      collectionsSynced++
      await sleep(NOTION_RATE_LIMIT_MS)
    }

    const collectionNotionToSupabase = { ...collectionIdByNotionId }

    const issues = await queryAllPages(NOTION_MNKY_ISSUES_DB)
    for (const p of issues) {
      const props = p.properties
      const collectionRel = getRelationIds(getProp(props, "Collection", "Issue") as NotionPage["properties"][string])
      const collectionNotionId = collectionRel[0]
      const collectionId = collectionNotionId ? collectionNotionToSupabase[collectionNotionId] : null
      if (!collectionId) continue

      const title = getTitle(getProp(props, "Title", "Name") as NotionPage["properties"][string]) || "Untitled"
      const slug = getRichText(getProp(props, "Slug") as NotionPage["properties"][string])?.trim() || slugify(title)
      const issueNumber = getNumber(getProp(props, "Issue Number", "Order") as NotionPage["properties"][string]) ?? 1
      const statusRaw = getSelect(getProp(props, "Status") as NotionPage["properties"][string])?.toLowerCase()
      const status = statusRaw === "published" ? "published" : "draft"
      const arcSummary = getRichText(getProp(props, "Arc Summary", "Summary") as NotionPage["properties"][string]) ?? null
      const coverUrl = getUrl(getProp(props, "Cover URL", "Cover", "cover_url") as NotionPage["properties"][string]) ?? null
      const publishedAt = getDate(getProp(props, "Published Date", "Published") as NotionPage["properties"][string]) ?? null

      const row = {
        collection_id: collectionId,
        issue_number: issueNumber,
        title,
        slug,
        status,
        arc_summary: arcSummary || null,
        cover_asset_url: coverUrl,
        published_at: status === "published" && publishedAt ? publishedAt : null,
        notion_id: p.id,
      }

      const { data: upserted } = await supabase
        .from("mnky_issues")
        .upsert(row, { onConflict: "notion_id", ignoreDuplicates: false })
        .select("id")
        .single()
      if (upserted) {
        issueIdByNotionId[p.id] = upserted.id
        issuesSynced++
      }
      await sleep(NOTION_RATE_LIMIT_MS)
    }

    if (NOTION_MNKY_CHAPTERS_DB) {
      const chapters = await queryAllPages(NOTION_MNKY_CHAPTERS_DB)
      const { data: allIssues } = await supabase.from("mnky_issues").select("id, notion_id")
      const issueNotionToSupabase: Record<string, string> = {}
      for (const i of allIssues ?? []) {
        if (i.notion_id) issueNotionToSupabase[i.notion_id] = i.id
      }

      for (const p of chapters) {
        const props = p.properties
        const issueRel = getRelationIds(getProp(props, "Issue", "Chapter") as NotionPage["properties"][string])
        const issueNotionId = issueRel[0]
        const issueId = issueNotionId ? issueNotionToSupabase[issueNotionId] : null
        if (!issueId) continue

        const fragranceName = getTitle(getProp(props, "Fragrance Name", "Fragrance") as NotionPage["properties"][string]) || getRichText(getProp(props, "Fragrance Name") as NotionPage["properties"][string]) || "Unknown"
        const shopifyGid = getRichText(getProp(props, "Shopify Product GID", "Product GID") as NotionPage["properties"][string]) || "gid://shopify/Product/0"
        const setting = getRichText(getProp(props, "Setting") as NotionPage["properties"][string]) ?? null
        const chapterOrder = getNumber(getProp(props, "Chapter Order", "Order") as NotionPage["properties"][string]) ?? 1

        const row = {
          issue_id: issueId,
          fragrance_name: fragranceName,
          shopify_product_gid: shopifyGid,
          setting,
          chapter_order: chapterOrder,
          notion_id: p.id,
        }

        const { data: upserted } = await supabase
          .from("mnky_chapters")
          .upsert(row, { onConflict: "notion_id", ignoreDuplicates: false })
          .select("id")
          .single()
        if (upserted) {
          chapterIdByNotionId[p.id] = upserted.id
          chaptersSynced++
        }
        await sleep(NOTION_RATE_LIMIT_MS)
      }
    }

    if (NOTION_MNKY_PANELS_DB && Object.keys(chapterIdByNotionId).length > 0) {
      const { data: allChapters } = await supabase.from("mnky_chapters").select("id, notion_id")
      const chapterNotionToSupabase: Record<string, string> = {}
      for (const c of allChapters ?? []) {
        if (c.notion_id) chapterNotionToSupabase[c.notion_id] = c.id
      }

      const panels = await queryAllPages(NOTION_MNKY_PANELS_DB)
      for (const p of panels) {
        const props = p.properties
        const chapterRel = getRelationIds(getProp(props, "Chapter", "Panel") as NotionPage["properties"][string])
        const chapterNotionId = chapterRel[0]
        const chapterId = chapterNotionId ? chapterNotionToSupabase[chapterNotionId] : null
        if (!chapterId) continue

        const panelNumber = getNumber(getProp(props, "Panel Number", "Order") as NotionPage["properties"][string]) ?? 1
        const scriptText = getRichText(getProp(props, "Script Text", "Script") as NotionPage["properties"][string]) ?? null
        const assetPrompt = getRichText(getProp(props, "Asset Prompt", "Prompt") as NotionPage["properties"][string]) ?? null
        const assetUrl = getUrl(getProp(props, "Asset URL", "Asset", "asset_url") as NotionPage["properties"][string]) ?? null

        const row = {
          chapter_id: chapterId,
          panel_number: panelNumber,
          script_text: scriptText,
          asset_prompt: assetPrompt,
          asset_url: assetUrl,
          notion_id: p.id,
        }

        const { data: upserted } = await supabase
          .from("mnky_panels")
          .upsert(row, { onConflict: "notion_id", ignoreDuplicates: false })
          .select("id")
          .single()
        if (upserted) {
          panelIdByNotionId[p.id] = upserted.id
          panelsSynced++
        }
        await sleep(NOTION_RATE_LIMIT_MS)
      }
    }

    if (NOTION_MNKY_HOTSPOTS_DB && Object.keys(panelIdByNotionId).length > 0) {
      const { data: allPanels } = await supabase.from("mnky_panels").select("id, notion_id")
      const panelNotionToSupabase: Record<string, string> = {}
      for (const p of allPanels ?? []) {
        if (p.notion_id) panelNotionToSupabase[p.notion_id] = p.id
      }

      const hotspots = await queryAllPages(NOTION_MNKY_HOTSPOTS_DB)
      for (const p of hotspots) {
        const props = p.properties
        const panelRel = getRelationIds(getProp(props, "Panel", "Hotspot") as NotionPage["properties"][string])
        const panelNotionId = panelRel[0]
        const panelId = panelNotionId ? panelNotionToSupabase[panelNotionId] : null
        if (!panelId) continue

        const typeRaw = (getSelect(getProp(props, "Type") as NotionPage["properties"][string]) ?? "product").toLowerCase()
        const type = ["product", "variant", "collection", "bundle"].includes(typeRaw) ? typeRaw : "product"
        const shopifyGid = getRichText(getProp(props, "Shopify GID", "Product GID") as NotionPage["properties"][string]) || "gid://shopify/Product/0"
        const x = getNumber(getProp(props, "X", "x") as NotionPage["properties"][string]) ?? 0.5
        const y = getNumber(getProp(props, "Y", "y") as NotionPage["properties"][string]) ?? 0.5
        const label = getRichText(getProp(props, "Label") as NotionPage["properties"][string]) ?? null
        const tooltip = getRichText(getProp(props, "Tooltip") as NotionPage["properties"][string]) ?? null

        const row = {
          panel_id: panelId,
          type,
          shopify_gid: shopifyGid,
          x: Math.max(0, Math.min(1, x)),
          y: Math.max(0, Math.min(1, y)),
          label,
          tooltip,
          notion_id: p.id,
        }

        await supabase.from("mnky_hotspots").upsert(row, { onConflict: "notion_id", ignoreDuplicates: false })
        hotspotsSynced++
        await sleep(NOTION_RATE_LIMIT_MS)
      }
    }

    return NextResponse.json({
      success: true,
      direction: "notion-to-supabase",
      collectionsSynced,
      issuesSynced,
      chaptersSynced,
      panelsSynced,
      hotspotsSynced,
      syncedAt: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
