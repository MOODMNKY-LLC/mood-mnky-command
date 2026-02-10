/**
 * Fetch CandleScience fragrance note glossary and seed Supabase (and optionally save raw file).
 *
 * Usage:
 *   pnpm tsx scripts/fetch-and-seed-glossary.ts
 *
 * This script:
 * 1. Fetches https://www.candlescience.com/fragrance-note-glossary/
 * 2. Converts HTML to the markdown format expected by the seed parser
 * 3. Writes scripts/data/fragrance-glossary-raw.txt (so you can re-run seed without re-fetching)
 * 4. Runs the same seed logic to upsert into Supabase
 *
 * Legal: CandleScience content is proprietary. For production use, paraphrase/rewrite or obtain permission.
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { config } from "dotenv"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import { execSync } from "child_process"

const envLocal = join(process.cwd(), ".env.local")
config({ path: existsSync(envLocal) ? envLocal : ".env" })

const GLOSSARY_URL = "https://www.candlescience.com/fragrance-note-glossary/"
const DATA_DIR = join(process.cwd(), "scripts", "data")
const RAW_FILE = join(DATA_DIR, "fragrance-glossary-raw.txt")

/**
 * Convert CandleScience glossary HTML into the markdown format expected by parseGlossaryMarkdown:
 * ### NoteName
 * #### Description:
 * content
 * #### Olfactive Profile:
 * ...
 * #### Facts:
 * ...
 */
function htmlToGlossaryMarkdown(html: string): string {
  // Remove script and style
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "")
  // Heading to markdown
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
  text = text.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n")
  // Paragraphs and divs to newline-separated text
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n")
  text = text.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, "$1\n")
  // Strip remaining tags and decode common entities
  text = text.replace(/<[^>]+>/g, "\n")
  text = text.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
  // Collapse multiple newlines and trim
  text = text.replace(/\n{3,}/g, "\n\n").trim()
  // Join "### \nNoteName" onto one line so parser sees "### NoteName"
  text = text.replace(/\n### \s*\n\s*([^\n#]+?)\s*\n/g, (_, name) => "\n### " + name.trim() + "\n")
  // Join "#### \nSection Name:" onto one line
  text = text.replace(/\n#### \s*\n\s*([^\n]+?)\s*\n/g, (_, label) => "\n#### " + label.trim() + "\n")
  return text
}

async function main() {
  console.log("Fetching", GLOSSARY_URL, "...")
  const res = await fetch(GLOSSARY_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; MOOD-MNKY-glossary-fetch/1.0)" },
  })
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`)
  }
  const html = await res.text()
  const markdown = htmlToGlossaryMarkdown(html)

  // Check we got something that looks like the glossary (### Note names)
  const noteBlocks = markdown.split(/\n### /).filter((b) => b.trim().length > 0)
  const likelyNotes = noteBlocks.filter(
    (b) => !b.includes("Fragrance notes") && !b.includes("starting with") && b.length < 500
  )
  if (likelyNotes.length < 10) {
    console.warn(
      "Warning: Only",
      likelyNotes.length,
      "note-like blocks found. The page may be client-rendered; fetch might not see full content."
    )
    console.warn("You can instead save the page as text to", RAW_FILE, "and run: pnpm seed:fragrance-notes --file=" + RAW_FILE)
  }

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
  writeFileSync(RAW_FILE, markdown, "utf-8")
  console.log("Wrote", RAW_FILE)

  console.log("Seeding Supabase from file...")
  execSync(`pnpm tsx scripts/seed-fragrance-notes.ts --file=${RAW_FILE}`, {
    stdio: "inherit",
    cwd: process.cwd(),
  })
  console.log("Done.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
