/**
 * Batch Formula Ingestion Script
 * Uses MCP fetch tools to systematically ingest all missing formulas
 * This script is designed to be run interactively with AI assistance
 */

import { FORMULA_CATALOG, getMissingFormulas, type FormulaCatalogEntry } from "./formula-catalog"
import { parseBlogHtml, phasesToPercentages, inferFunction, escapeSql, calculatePercentageSum } from "./ingest-whole-elise-formulas"

const BASE = "https://wholeelise.com"

interface ParsedResult {
  formula: FormulaCatalogEntry
  parsed: ReturnType<typeof parseBlogHtml>
  sql: string
  verified: boolean
  percentageSum: number
}

/**
 * Generate SQL for a parsed formula
 */
function generateSqlForParsed(
  formula: FormulaCatalogEntry,
  parsed: NonNullable<ReturnType<typeof parseBlogHtml>>,
  verified: boolean
): string {
  const phases = phasesToPercentages(parsed.phases, parsed.totalG)
  const lines: string[] = []
  
  const description = parsed.description || ""
  const tags = parsed.tags || []
  const tagsJson = JSON.stringify(tags).replace(/'/g, "''")
  
  lines.push(`-- ${formula.name} (${parsed.totalG}g)`)
  if (!verified) {
    lines.push(`-- WARNING: Percentage sum = ${calculatePercentageSum(phases).toFixed(1)}% (may not equal 100%)`)
  }
  lines.push(`DO $$`)
  lines.push(`DECLARE f_id uuid; p_id uuid;`)
  lines.push(`BEGIN`)
  lines.push(
    `  INSERT INTO public.formulas (name, slug, description, category_id, total_weight_g, source, external_url, tags)`
  )
  lines.push(
    `  VALUES ('${escapeSql(formula.name)}', '${formula.slug}', '${escapeSql(description)}', '${formula.category}', ${parsed.totalG}, 'whole-elise', '${BASE}${formula.blogUrl}', '${tagsJson}')`
  )
  lines.push(
    `  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, total_weight_g = EXCLUDED.total_weight_g, external_url = EXCLUDED.external_url, description = EXCLUDED.description`
  )
  lines.push(`  RETURNING id INTO f_id;`)
  lines.push(
    `  DELETE FROM public.formula_ingredients WHERE phase_id IN (SELECT id FROM public.formula_phases WHERE formula_id = f_id);`
  )
  lines.push(`  DELETE FROM public.formula_phases WHERE formula_id = f_id;`)
  
  let phaseOrder = 0
  for (const phase of phases) {
    phaseOrder++
    lines.push(
      `  INSERT INTO public.formula_phases (formula_id, sort_order, name) VALUES (f_id, ${phaseOrder}, '${escapeSql(phase.name)}') RETURNING id INTO p_id;`
    )
    let ingOrder = 0
    for (const ing of phase.ingredients) {
      ingOrder++
      const fn = inferFunction(ing.name)
      const fo = ing.isFragranceOil ? "true" : "false"
      const percentage = ing.percentage || 0
      lines.push(
        `  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, ${ingOrder}, '${escapeSql(ing.name)}', '${escapeSql(fn)}', ${percentage}, ${fo});`
      )
    }
  }
  lines.push(`END $$;`)
  lines.push("")
  return lines.join("\n")
}

/**
 * Process a single formula (to be called with MCP fetch)
 */
export async function processFormula(formula: FormulaCatalogEntry, html: string): Promise<ParsedResult | null> {
  const parsed = parseBlogHtml(html)
  if (!parsed) {
    return null
  }
  
  const phases = phasesToPercentages(parsed.phases, parsed.totalG)
  const percentageSum = calculatePercentageSum(phases)
  const verified = Math.abs(percentageSum - 100) < 0.5 // 0.5% tolerance
  
  const sql = generateSqlForParsed(formula, parsed, verified)
  
  return {
    formula,
    parsed,
    sql,
    verified,
    percentageSum,
  }
}

/**
 * Get list of formulas to process by category
 */
export function getFormulasToProcess(category?: "skincare" | "haircare" | "diy"): FormulaCatalogEntry[] {
  return getMissingFormulas(category)
}
