/**
 * Seed Fragrance Notes Glossary
 * Parses CandleScience-style glossary content and inserts into Supabase.
 *
 * Usage:
 *   npx tsx scripts/seed-fragrance-notes.ts
 *   npx tsx scripts/seed-fragrance-notes.ts --file scripts/data/fragrance-glossary-raw.txt
 *
 * For full glossary: fetch https://www.candlescience.com/fragrance-note-glossary/
 * and save to scripts/data/fragrance-glossary-raw.txt, then run with --file.
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { config } from "dotenv"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

// Load .env.local for Supabase credentials when running outside Next.js
const envLocal = join(process.cwd(), ".env.local")
config({ path: existsSync(envLocal) ? envLocal : ".env" })

import { createAdminClient } from "../lib/supabase/admin"

interface ParsedNote {
  name: string
  descriptionShort: string
  olfactiveProfile: string
  facts: string
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Parse glossary markdown format:
 * ### NoteName
 * #### Description:
 * content
 * #### Olfactive Profile:
 * content
 * #### Facts:
 * content
 */
function parseGlossaryMarkdown(content: string): ParsedNote[] {
  const notes: ParsedNote[] = []
  const blocks = content.split(/\n### /)
  for (const block of blocks) {
    if (!block.trim()) continue
    const lines = block.split("\n")
    const nameMatch = lines[0].match(/^([^#\n]+)/)
    if (!nameMatch) continue
    const name = nameMatch[1].trim()
    if (!name || name.length < 2) continue
    if (
      name.includes("Fragrance notes") ||
      name.includes("starting with") ||
      name.length > 80
    )
      continue

    const text = block.replace(/^[^\n]+\n/, "")
    const descMatch = text.match(/#### Description:\s*\n([\s\S]*?)(?=\n#### |$)/i)
    const profileMatch = text.match(
      /#### Olfactive Profile:\s*\n([\s\S]*?)(?=\n#### |$)/i
    )
    const factsMatch = text.match(/#### Facts:\s*\n([\s\S]*?)(?=\n#### |$)/i)

    notes.push({
      name,
      descriptionShort: (descMatch?.[1] || "").trim(),
      olfactiveProfile: (profileMatch?.[1] || "").trim(),
      facts: (factsMatch?.[1] || "").trim(),
    })
  }
  return notes
}

/** Minimal embedded dataset for testing when no file is provided */
const EMBEDDED_NOTES: ParsedNote[] = [
  { name: "Vanilla", descriptionShort: "warm, aromatic, gourmand, sweet, rich, comforting", olfactiveProfile: "Vanilla has a rich, sweet, and gourmand aroma that's familiar and comforting, with cocooning notes of caramel.", facts: "Vanilla is the only edible fruit of the orchid family, the largest family of flowering plants in the world." },
  { name: "Bergamot", descriptionShort: "citrus, floral, spicy, dry, aldehydic, fruity", olfactiveProfile: "With its citrus, green, floral, and solar notes, Bergamot is reminiscent of the warm Mediterranean sun.", facts: "The fruit is a cross between the pear lemon and the Seville orange or grapefruit. The name is derived from the city of Bergamo in Lombardy, Italy." },
  { name: "Lavender", descriptionShort: "aromatic, floral, herbaceous, fruity, woody, balsamic", olfactiveProfile: "Lavender has a fresh, slightly fruity, herbaceous floral quality with woody camphorous accents.", facts: "Bees and butterflies love lavender as much as we do! Lavender's nectar-rich flowers provide an important food source for pollinators." },
  { name: "Jasmine", descriptionShort: "floral, powerful, sweet, animalic", olfactiveProfile: "Jasmine's elegantly curved leaves and delicate white petals provide a floral, sweet, and slightly animalic fragrance.", facts: "Jasmine is a genus of plants in the olive family, Oleaceae. There are over 200 species of jasmine." },
  { name: "Sandalwood", descriptionShort: "woody, creamy, sweet, balsamic, cedar, warm, spicy", olfactiveProfile: "Sandalwood has a rich wood tonality with soft, creamy, and sweet accents.", facts: "The earliest records of sandalwood in Ayurvedic texts are estimated to date back as far as 500 BCE." },
  { name: "Cedar", descriptionShort: "balsamic, woody, soft, cooling, musky", olfactiveProfile: "Cedar has a strong woody note, yet is warm and spicy. It is often used in blend with other woods.", facts: "Cedarwood oil was widely used in historical perfumery. Ancient Sumerians used it as a base for paints, and ancient Egyptians used it in embalming." },
  { name: "Amber", descriptionShort: "warm, sensual, exotic, musky, soft, slightly sweet, slightly spicy", olfactiveProfile: "Amber is associated with sweet, spicy, and aromatic notes evocative of exotic places and warm memories.", facts: "Amber is made from fossilized tree resin. The actual scent we refer to as amber is more of an emulation of the rich, golden appearance." },
  { name: "Patchouli", descriptionShort: "woody, camphorated, green, earthy, mossy, balsamic, powdery", olfactiveProfile: "Patchouli's aroma is woody, earthy, and slightly sweet with powdery undertones.", facts: "Patchouli is native to tropical Asia, where it is widely cultivated and has been used for centuries for its essential oil." },
  { name: "Rose", descriptionShort: "floral, sensual, powdery, romantic, sweet", olfactiveProfile: "The traditional aroma of rose is sweet, floral, and romantic with warm and slightly spicy undertones.", facts: "The roses most commonly used in perfumery are the Turkish rose, the Damask rose, and the Centifolia rose from Grasse." },
  { name: "Musk", descriptionShort: "animalic, clean, comfortable, long-lasting, powdery, round, sexy, soft", olfactiveProfile: "Musky notes are animalic, skin-like, and sensual. This popular note adds depth and longevity to fragrances.", facts: "Professor Leopold Ruzicka was the first to synthesize musk molecules, making it possible to create musk fragrances without animals." },
]

async function main() {
  const fileArg = process.argv.find((a) => a.startsWith("--file="))
  const filePath = fileArg
    ? fileArg.replace("--file=", "")
    : join(process.cwd(), "scripts", "data", "fragrance-glossary-raw.txt")

  let notes: ParsedNote[]
  if (existsSync(filePath)) {
    const content = readFileSync(filePath, "utf-8")
    notes = parseGlossaryMarkdown(content)
    console.log(`Parsed ${notes.length} notes from ${filePath}`)
  } else {
    notes = EMBEDDED_NOTES
    console.log(
      `No file at ${filePath}. Using embedded dataset (${notes.length} notes).`
    )
    console.log(
      "For full glossary: fetch the CandleScience page and save to scripts/data/fragrance-glossary-raw.txt"
    )
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()
  let inserted = 0
  let updated = 0

  for (const note of notes) {
    const slug = slugify(note.name)
    if (!slug) continue

    const row = {
      name: note.name,
      slug,
      description_short: note.descriptionShort,
      olfactive_profile: note.olfactiveProfile,
      facts: note.facts,
      updated_at: now,
    }

    const { data: existing } = await supabase
      .from("fragrance_notes")
      .select("id")
      .eq("slug", slug)
      .single()

    if (existing) {
      await supabase
        .from("fragrance_notes")
        .update(row)
        .eq("slug", slug)
      updated++
    } else {
      await supabase.from("fragrance_notes").insert(row)
      inserted++
    }
  }

  console.log(`Done: ${inserted} inserted, ${updated} updated`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
