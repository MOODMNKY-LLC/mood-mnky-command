import { Client } from "@notionhq/client"
import { NotionToMarkdown } from "notion-to-md"

const NOTION_API_KEY = process.env.NOTION_API_KEY || ""

/**
 * Converts a Notion page's body blocks to Markdown.
 * Uses notion-to-md with @notionhq/client.
 * @param pageId - Notion page ID (with or without dashes)
 * @returns Markdown string of the page body, or empty string on error
 */
export async function fetchPageBlocksToMarkdown(pageId: string): Promise<string> {
  if (!NOTION_API_KEY) return ""

  const notion = new Client({ auth: NOTION_API_KEY })
  const n2m = new NotionToMarkdown({ notionClient: notion })

  try {
    const mdblocks = await n2m.pageToMarkdown(pageId)
    const mdString = n2m.toMarkdownString(mdblocks)
    return (mdString.parent ?? "").trim()
  } catch {
    return ""
  }
}
