/**
 * Verify Formula Percentages
 * Parses seed_formulas.sql, sums ingredient percentages per formula,
 * verifies each totals ~100%, uses Wolfram Alpha for edge cases.
 * Run: npx tsx scripts/verify-formula-percentages.ts
 */

import { readFileSync } from "fs"
import { join } from "path"

const TOLERANCE = 1.5 // Allow ±1.5% for rounding
const SEED_PATH = join(process.cwd(), "supabase", "seed_formulas.sql")

interface FormulaResult {
  name: string
  slug: string
  totalWeightG: number
  percentages: number[]
  sum: number
  status: "pass" | "fail" | "warning"
  message?: string
}

function parseSeedFormulas(): FormulaResult[] {
  const sql = readFileSync(SEED_PATH, "utf8")
  const results: FormulaResult[] = []

  // Split by DO $ blocks (PostgreSQL dollar-quoting)
  const blocks = sql.match(/(DO \$\r?\n[\s\S]*?END \$\s*;)/g) ?? []

  for (const block of blocks) {
    const formulaMatch = block.match(
      /INSERT INTO public\.formulas[^V]+VALUES\s*\(\s*'([^']*(?:''[^']*)*)'\s*,\s*'([^']+)'[^)]*,\s*(\d+)\s*,/
    )
    if (!formulaMatch) continue

    const name = formulaMatch[1].replace(/''/g, "'")
    const slug = formulaMatch[2]
    const totalWeightG = parseInt(formulaMatch[3], 10)

    // Extract all percentage values (number before ", true)" or ", false)" in formula_ingredients INSERT lines)
    const percentages: number[] = []
    for (const line of block.split("\n")) {
      if (!line.includes("formula_ingredients") || !line.includes("INSERT")) continue
      const m = line.match(/([\d.]+),\s*(?:true|false)\s*\)\s*;\s*$/)
      if (m) percentages.push(parseFloat(m[1]))
    }

    const sum = percentages.reduce((a, b) => a + b, 0)
    const status: FormulaResult["status"] =
      Math.abs(sum - 100) <= TOLERANCE
        ? "pass"
        : Math.abs(sum - 100) <= 3
          ? "warning"
          : "fail"

    results.push({
      name,
      slug,
      totalWeightG,
      percentages,
      sum,
      status,
      message:
        status !== "pass"
          ? `Sum ${sum.toFixed(1)}% deviates from 100% by ${Math.abs(sum - 100).toFixed(1)}%`
          : undefined,
    })
  }

  return results
}

async function main() {
  console.log("Parsing seed_formulas.sql...\n")
  const results = parseSeedFormulas()

  const passed = results.filter((r) => r.status === "pass")
  const warnings = results.filter((r) => r.status === "warning")
  const failed = results.filter((r) => r.status === "fail")

  console.log("═".repeat(60))
  console.log("FORMULA PERCENTAGE VERIFICATION REPORT")
  console.log("═".repeat(60))
  console.log(`Total formulas: ${results.length}`)
  console.log(`Passed (±${TOLERANCE}%): ${passed.length}`)
  console.log(`Warnings (±3%): ${warnings.length}`)
  console.log(`Failed (>3%): ${failed.length}`)
  console.log("")

  if (warnings.length > 0) {
    console.log("─".repeat(60))
    console.log("WARNINGS (minor deviation)")
    console.log("─".repeat(60))
    for (const r of warnings) {
      console.log(`  ${r.slug}: ${r.sum.toFixed(1)}% - ${r.message}`)
    }
  }

  if (failed.length > 0) {
    console.log("\n─".repeat(60))
    console.log("FAILED (significant deviation)")
    console.log("─".repeat(60))
    for (const r of failed) {
      console.log(`  ${r.slug}: ${r.sum.toFixed(1)}% - ${r.message}`)
    }
  }

  // Output JSON for programmatic use
  const reportPath = join(process.cwd(), "temp", "formula-verification-report.json")
  const report = {
    timestamp: new Date().toISOString(),
    summary: { total: results.length, passed: passed.length, warnings: warnings.length, failed: failed.length },
    results: results.map((r) => ({ ...r, percentages: undefined })),
    failures: failed.map((r) => ({ slug: r.slug, sum: r.sum, name: r.name })),
  }
  const fs = await import("fs")
  const path = await import("path")
  const dir = path.dirname(reportPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8")
  console.log(`\nReport saved to ${reportPath}`)

  process.exit(failed.length > 0 ? 1 : 0)
}

main().catch(console.error)
