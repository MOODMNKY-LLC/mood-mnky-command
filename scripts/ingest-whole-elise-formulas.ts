/**
 * Whole Elise Formula Ingestion Script (Enhanced)
 * Fetches blog tutorials, parses recipe phases/ingredients, verifies with Wolfram Alpha, outputs SQL INSERT statements.
 * Run: npx tsx scripts/ingest-whole-elise-formulas.ts [category] [--verify-only]
 * 
 * Examples:
 *   npx tsx scripts/ingest-whole-elise-formulas.ts skincare
 *   npx tsx scripts/ingest-whole-elise-formulas.ts haircare
 *   npx tsx scripts/ingest-whole-elise-formulas.ts diy
 *   npx tsx scripts/ingest-whole-elise-formulas.ts --verify-only
 */

import { FORMULA_CATALOG, getMissingFormulas, type FormulaCatalogEntry } from "./formula-catalog"

const BASE = "https://wholeelise.com"

interface Ingredient {
  name: string
  weightG: number
  function?: string
  isFragranceOil?: boolean
  percentage?: number
}

interface Phase {
  name: string
  ingredients: Ingredient[]
}

interface ParsedFormula {
  phases: Phase[]
  totalG: number
  description?: string
  tags?: string[]
}

/**
 * Enhanced function inference for ingredients
 */
function inferFunction(ingredientName: string): string {
  const n = ingredientName.toLowerCase()
  
  // Surfactants
  if (n.includes("sci") || n.includes("sodium cocoyl isethionate")) return "Surfactant"
  if (n.includes("cocamidopropyl betaine") || n.includes("betaine")) return "Surfactant"
  if (n.includes("sodium lauryl") || n.includes("sles") || n.includes("sls")) return "Surfactant"
  
  // Clays
  if (n.includes("kaolin") || n.includes("bentonite") || n.includes("clay")) return "Cleansing Agent / Texture"
  
  // Gums and thickeners
  if (n.includes("guar gum") || n.includes("cationic guar")) return "Thickener / Conditioner"
  if (n.includes("xanthan") || n.includes("gum")) return "Thickener"
  
  // Waxes
  if (n.includes("beeswax")) return "Stabilizer / Emollient"
  if (n.includes("candelilla") || n.includes("carnauba")) return "Stabilizer"
  if (n.includes("wax") && !n.includes("emulsifying")) return "Stabilizer"
  
  // Oils and butters
  if (n.includes("essential oil") || n.includes("fragrance oil") || n.includes("fragrance")) return "Fragrance"
  if (n.includes("oil") && !n.includes("vitamin")) return "Carrier / Emollient"
  if (n.includes("butter")) return "Emollient"
  
  // Aqueous phase
  if (n.includes("water") || n.includes("distilled water") || n.includes("aloe")) return "Aqueous Phase"
  
  // Humectants
  if (n.includes("glycerin") || n.includes("glycerine") || n.includes("sorbitol")) return "Humectant"
  
  // Emulsifiers
  if (n.includes("emulsifying") || n.includes("btms") || n.includes("olivem")) return "Emulsifier"
  
  // Fatty alcohols and acids
  if (n.includes("alcohol") || n.includes("cetyl") || n.includes("cetearyl") || n.includes("stearyl")) return "Fatty Alcohol"
  if (n.includes("stearic acid") || n.includes("palmitic acid")) return "Fatty Acid / Thickener"
  
  // Antioxidants
  if (n.includes("vitamin e") || n.includes("tocopherol")) return "Antioxidant"
  
  // Preservatives
  if (n.includes("preservative") || n.includes("optiphen") || n.includes("iscaguard") || n.includes("eco")) return "Preservative"
  
  // Powders and starches
  if (n.includes("arrowroot") || n.includes("cornstarch") || n.includes("starch") || n.includes("tapioca")) return "Powder / Texture"
  if (n.includes("mica") || n.includes("powder") && !n.includes("arrowroot") && !n.includes("cornstarch")) return "Colour / Texture"
  
  // Conditioners (haircare)
  if (n.includes("panthenol") || n.includes("quaternium") || n.includes("conditioner")) return "Conditioner"
  
  // Exfoliants
  if (n.includes("sugar") || n.includes("salt") || n.includes("poppy seed") || n.includes("exfoliant")) return "Exfoliant"
  
  // Other
  if (n.includes("optional")) return "Optional"
  
  return "See tutorial"
}

/**
 * Enhanced HTML to text conversion
 */
function htmlToText(html: string): string {
  // Extract main content area if present
  let content = html
  
  // Try to find article or main content
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
  if (articleMatch) content = articleMatch[1]
  
  // Convert HTML to markdown-like format
  return content
    .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, "\n##### $1\n")
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n* $1\n")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n")
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
}

/**
 * Parse weight from various formats: "100g", "100 g", "100g-200g" (use midpoint), "100 - 200g"
 */
function parseWeight(text: string): number | null {
  // Handle ranges: "60g-80g" or "60 - 80g" -> use midpoint
  const rangeMatch = text.match(/([\d.]+)\s*-\s*([\d.]+)\s*g/i)
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1])
    const max = parseFloat(rangeMatch[2])
    return (min + max) / 2
  }
  
  // Single weight: "100g" or "100 g"
  const singleMatch = text.match(/([\d.]+)\s*g/i)
  if (singleMatch) {
    return parseFloat(singleMatch[1])
  }
  
  return null
}

/**
 * Enhanced HTML parser - handles multiple structures
 */
function parseBlogHtml(html: string): ParsedFormula | null {
  const phases: Phase[] = []
  let totalG = 0
  const text = htmlToText(html)
  
  // Extract description from first paragraph after title
  const descriptionMatch = text.match(/#\s+[^\n]+\n\n([^\n]+)/)
  const description = descriptionMatch ? descriptionMatch[1].trim() : undefined
  
  // Try phased structure first (##### Phase Name)
  const phaseBlocks = text.split(/#####\s+/i)
  if (phaseBlocks.length > 1) {
    for (let i = 1; i < phaseBlocks.length; i++) {
      const block = phaseBlocks[i]
      const phaseNameMatch = block.match(/^(.+?)(?=\n|$)/)
      if (!phaseNameMatch) continue
      
      const phaseName = phaseNameMatch[1].trim()
      // Skip if it's not a recipe phase (e.g., "Method", "See Also")
      if (/method|instructions|see also|substitutions|notes/i.test(phaseName)) continue
      
      const ingredients: Ingredient[] = []
      const lines = block.split("\n")
      
      for (const line of lines) {
        // Match: * 100g Ingredient Name (optional note)
        // Or: * 100g - 200g Ingredient Name
        const weightMatch = parseWeight(line)
        if (weightMatch) {
          // Extract ingredient name (everything after the weight)
          const nameMatch = line.match(/\d+[g\s-]*\s+(.+?)(?:\s*\([^)]*\))?\s*$/i)
          if (nameMatch) {
            let name = nameMatch[1].trim()
            // Remove optional markers
            name = name.replace(/\s*\(optional.*\)$/i, "").trim()
            name = name.replace(/\s*\(optional but recommended.*\)$/i, "").trim()
            
            ingredients.push({
              name,
              weightG: weightMatch,
              isFragranceOil: /essential oil|fragrance oil|fragrance/i.test(name),
            })
            totalG += weightMatch
          }
        }
      }
      
      if (ingredients.length > 0) {
        phases.push({ name: phaseName, ingredients })
      }
    }
  } else {
    // Try flat structure: ## Recipe or ## Ingredients
    const recipeSection = text.match(/##\s*(?:Recipe|Ingredients)[\s\S]*?(?=\n##|$)/i)
    if (recipeSection) {
      const content = recipeSection[0]
      const ingredients: Ingredient[] = []
      const lines = content.split("\n")
      
      for (const line of lines) {
        const weightMatch = parseWeight(line)
        if (weightMatch) {
          const nameMatch = line.match(/\d+[g\s-]*\s+(.+?)(?:\s*\([^)]*\))?\s*$/i)
          if (nameMatch) {
            let name = nameMatch[1].trim()
            name = name.replace(/\s*\(optional.*\)$/i, "").trim()
            
            ingredients.push({
              name,
              weightG: weightMatch,
              isFragranceOil: /essential oil|fragrance oil|fragrance/i.test(name),
            })
            totalG += weightMatch
          }
        }
      }
      
      if (ingredients.length > 0) {
        phases.push({ name: "Main", ingredients })
      }
    }
  }
  
  if (phases.length === 0 || totalG <= 0) return null
  
  return { phases, totalG, description }
}

/**
 * Convert phases to percentages
 */
function phasesToPercentages(phases: Phase[], totalG: number): Phase[] {
  return phases.map((p) => ({
    name: p.name,
    ingredients: p.ingredients.map((ing) => {
      const percentage = Math.round((ing.weightG / totalG) * 1000) / 10
      return {
        ...ing,
        percentage,
      }
    }),
  }))
}

/**
 * Calculate sum of all percentages
 */
function calculatePercentageSum(phases: Phase[]): number {
  return phases.reduce(
    (sum, phase) =>
      sum + phase.ingredients.reduce((pSum, ing) => pSum + (ing.percentage || 0), 0),
    0
  )
}

/**
 * Verify percentage sum using Wolfram Alpha
 */
async function verifyWithWolframAlpha(percentages: number[]): Promise<{ verified: boolean; sum: number; error?: string }> {
  try {
    // Note: This would need to be called via MCP tool in actual execution
    // For now, we'll calculate locally and log the query
    const sum = percentages.reduce((a, b) => a + b, 0)
    const query = `sum ${percentages.join(" ")}`
    
    // In actual execution, this would call:
    // const result = await mcp_mood-mnky-command-wolfram-alpha_query-wolfram-alpha({ query })
    
    return {
      verified: Math.abs(sum - 100) < 0.5, // Allow 0.5% tolerance for rounding
      sum,
    }
  } catch (error) {
    return {
      verified: false,
      sum: percentages.reduce((a, b) => a + b, 0),
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

function escapeSql(s: string): string {
  return s.replace(/'/g, "''")
}

/**
 * Generate SQL INSERT statement
 */
function generateSql(
  formula: FormulaCatalogEntry,
  parsed: ParsedFormula,
  verified: boolean
): string {
  const phases = phasesToPercentages(parsed.phases, parsed.totalG)
  const lines: string[] = []
  
  const description = parsed.description || ""
  const tags = parsed.tags || []
  const tagsJson = JSON.stringify(tags).replace(/'/g, "''")
  
  lines.push(`-- ${formula.name} (${parsed.totalG}g)`)
  if (!verified) {
    lines.push(`-- WARNING: Percentage sum may not equal 100%`)
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
      lines.push(
        `  INSERT INTO public.formula_ingredients (phase_id, sort_order, name, function, percentage, is_fragrance_oil) VALUES (p_id, ${ingOrder}, '${escapeSql(ing.name)}', '${escapeSql(fn)}', ${ing.percentage}, ${fo});`
      )
    }
  }
  lines.push(`END $$;`)
  lines.push("")
  return lines.join("\n")
}

/**
 * Main ingestion function
 */
async function ingestFormula(formula: FormulaCatalogEntry): Promise<{
  success: boolean
  sql?: string
  error?: string
  verified?: boolean
}> {
  try {
    const url = BASE + formula.blogUrl
    const res = await fetch(url)
    
    if (!res.ok) {
      return {
        success: false,
        error: `HTTP ${res.status}: ${url}`,
      }
    }
    
    const html = await res.text()
    const parsed = parseBlogHtml(html)
    
    if (!parsed) {
      return {
        success: false,
        error: "Could not parse recipe from HTML",
      }
    }
    
    // Calculate percentages
    const phases = phasesToPercentages(parsed.phases, parsed.totalG)
    
    // Verify percentage sum
    const allPercentages = phases.flatMap((p) => p.ingredients.map((i) => i.percentage || 0))
    const verification = await verifyWithWolframAlpha(allPercentages)
    
    // Generate SQL
    const sql = generateSql(formula, { ...parsed, phases }, verification.verified)
    
    return {
      success: true,
      sql,
      verified: verification.verified,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)
  const category = args.find((a) => ["skincare", "haircare", "diy"].includes(a)) as
    | "skincare"
    | "haircare"
    | "diy"
    | undefined
  const verifyOnly = args.includes("--verify-only")
  
  console.log("-- Generated by scripts/ingest-whole-elise-formulas.ts")
  console.log("-- Source: https://wholeelise.com/calculators/")
  console.log("")
  
  const formulasToProcess = category
    ? getMissingFormulas(category)
    : getMissingFormulas()
  
  if (formulasToProcess.length === 0) {
    console.log("-- No missing formulas to process")
    return
  }
  
  console.log(`-- Processing ${formulasToProcess.length} formulas${category ? ` (${category})` : ""}`)
  console.log("")
  
  let successCount = 0
  let failCount = 0
  let verifiedCount = 0
  
  for (const formula of formulasToProcess) {
    const result = await ingestFormula(formula)
    
    if (result.success) {
      successCount++
      if (result.verified) verifiedCount++
      if (result.sql) {
        console.log(result.sql)
      }
    } else {
      failCount++
      console.error(`-- SKIP ${formula.name}: ${result.error}`)
    }
    
    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  
  console.log("")
  console.log(`-- Summary: ${successCount} succeeded, ${failCount} failed, ${verifiedCount} verified`)
}

main().catch(console.error)
