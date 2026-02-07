/**
 * Normalize Formula Percentages
 * For formulas with sum 97-103% (warning range), scale each percentage by 100/sum
 * so they total exactly 100%. Preserves relative proportions.
 * Run: npx tsx scripts/normalize-formula-percentages.ts
 */

import { readFileSync, writeFileSync } from "fs"
import { join } from "path"

const SEED_PATH = join(process.cwd(), "supabase", "seed_formulas.sql")

function roundPct(v: number, decimals: number = 1): number {
  return Math.round(v * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

function main() {
  let sql = readFileSync(SEED_PATH, "utf8")

  // Split by DO $ blocks (PostgreSQL dollar-quoting; tag can be $ or $$)
  const blocks = sql.match(/(DO \$\r?\n[\s\S]*?END \$\s*;)/g) ?? []
  let modified = 0

  // Process each block
  const newBlocks = blocks.map((block) => {
    // Find all formula_ingredients lines with percentage
    const lines = block.split("\n")
    const pctIndices: { lineIdx: number; oldPct: number }[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line.includes("formula_ingredients") || !line.includes("INSERT")) continue
      // Match percentage as number before ", true)" or ", false)" (handles names with commas)
      const m = line.match(/([\d.]+),\s*(?:true|false)\s*\)\s*;\s*$/)
      if (m) {
        pctIndices.push({ lineIdx: i, oldPct: parseFloat(m[1]) })
      }
    }

    if (pctIndices.length === 0) return block

    const sum = pctIndices.reduce((a, b) => a + b.oldPct, 0)
    const slugMatch = block.match(/INSERT INTO public\.formulas[^V]+VALUES\s*\(\s*'[^']*',\s*'([^']+)'/)
    const slug = slugMatch ? slugMatch[1] : "?"
    const deviation = Math.abs(sum - 100)

    // Only normalize if in warning range (1.5% < deviation <= 3%)
    if (deviation <= 1.5 || deviation > 3) return block

    const scale = 100 / sum
    const scaled = pctIndices.map(({ oldPct }) => roundPct(oldPct * scale, 1))
    const newSum = scaled.reduce((a, b) => a + b, 0)

    // Adjust largest value to hit exactly 100% (fix rounding)
    const diff = Math.round((100 - newSum) * 10) / 10
    if (Math.abs(diff) > 0.01) {
      const maxIdx = scaled.indexOf(Math.max(...scaled))
      scaled[maxIdx] = roundPct(scaled[maxIdx] + diff, 1)
    }

    // Apply to lines
    const newLines = [...lines]
    for (let j = 0; j < pctIndices.length; j++) {
      const { lineIdx } = pctIndices[j]
      const line = newLines[lineIdx]
      const newPct = scaled[j]
      const formatted = newPct % 1 === 0 ? newPct.toString() : newPct.toFixed(1)
      newLines[lineIdx] = line.replace(
        /([\d.]+)(,\s*(?:true|false)\s*\)\s*;\s*$)/,
        `${formatted}$2`
      )
    }

    modified++
    return newLines.join("\n")
  })

  // Reconstruct file - replace blocks in original order
  let out = sql
  for (let i = 0; i < blocks.length; i++) {
    out = out.replace(blocks[i], newBlocks[i])
  }

  writeFileSync(SEED_PATH, out, "utf8")
  console.log(`Normalized ${modified} formula blocks. Total blocks: ${blocks.length}`)
}

main()
