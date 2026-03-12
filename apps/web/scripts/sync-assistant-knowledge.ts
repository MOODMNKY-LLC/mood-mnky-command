/**
 * Sync selected Notion pages to assistant_knowledge for the storefront AI.
 * Run: pnpm notion:sync-assistant-knowledge
 * Requires: NOTION_API_KEY, NOTION_ASSISTANT_PAGE_IDS (comma-separated page IDs), Supabase env
 */

import "./env-loader"
import { retrievePage, getTitle, isConfigured } from "../lib/notion"
import { fetchPageBlocksToMarkdown } from "../lib/notion-blocks"
import { createAdminClient } from "../lib/supabase/admin"

const NOTION_RATE_LIMIT_MS = 500

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type AssistantSource = "faq" | "about" | "shipping" | "policies" | "general"

async function main() {
  if (!isConfigured()) {
    console.error("NOTION_API_KEY is not set. Add it to .env or .env.local")
    process.exit(1)
  }

  const pageIdsEnv = process.env.NOTION_ASSISTANT_PAGE_IDS ?? ""
  const pageIds = pageIdsEnv
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)

  if (pageIds.length === 0) {
    console.log(
      "No pages to sync. Set NOTION_ASSISTANT_PAGE_IDS (comma-separated Notion page IDs) in .env"
    )
    process.exit(0)
  }

  const supabase = createAdminClient()
  let synced = 0

  for (const pageId of pageIds) {
    await sleep(NOTION_RATE_LIMIT_MS)
    const page = await retrievePage(pageId)
    if (!page) {
      console.warn(`Page ${pageId} not found or inaccessible, skipping`)
      continue
    }

    await sleep(NOTION_RATE_LIMIT_MS)
    const content = await fetchPageBlocksToMarkdown(pageId)
    const titleProp = Object.values(page.properties).find((p) => p.type === "title")
    const title = getTitle(titleProp) || "Untitled"

    const row = {
      notion_id: page.id,
      title,
      content: content || "",
      source: "general" as AssistantSource,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("assistant_knowledge").upsert(row, {
      onConflict: "notion_id",
      ignoreDuplicates: false,
    })

    if (error) {
      console.error(`Failed to upsert ${title}:`, error.message)
    } else {
      synced++
      console.log(`Synced: ${title}`)
    }
  }

  console.log(`\nDone. Synced ${synced}/${pageIds.length} pages to assistant_knowledge.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
