import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getThumbnailUrlFromPublicUrl } from "@/lib/supabase/storage"
import { dbRowToFragranceOil } from "@/lib/fragrance-oils-db"
import type { FragranceOil, Formula } from "@/lib/types"

type FormulaRow = {
  id: string
  name: string
  slug: string
  description: string | null
  category_id: string
  total_weight_g: number
  source: string
  external_url: string | null
  tags: string[] | null
  formula_phases: Array<{
    id: string
    sort_order: number
    name: string
    formula_ingredients: Array<{
      id: string
      sort_order: number
      name: string
      function: string | null
      percentage: number
      is_fragrance_oil: boolean
    }>
  }>
}

function mapCategoryToProductType(categoryId: string): Formula["productType"] {
  const map: Record<string, Formula["productType"]> = {
    skincare: "skincare",
    haircare: "haircare",
    diy: "body-butter",
    candle: "candle",
  }
  return map[categoryId] || "skincare"
}

function formulaRowToFormula(row: FormulaRow): Formula {
  const phases = (row.formula_phases || [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((p) => ({
      id: p.id,
      name: p.name,
      ingredients: (p.formula_ingredients || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((i) => ({
          id: i.id,
          name: i.name,
          function: i.function || "See tutorial",
          percentage: i.percentage,
          isFragranceOil: i.is_fragrance_oil,
        })),
    }))
  return {
    id: row.id,
    name: row.name,
    productType: mapCategoryToProductType(row.category_id),
    description: row.description || "",
    phases,
    totalWeight: row.total_weight_g,
    source: row.source as "whole-elise" | "mood-mnky" | "custom",
    tags: row.tags || [],
    createdAt: new Date().toISOString().split("T")[0],
    categoryId: row.category_id as "skincare" | "haircare" | "diy" | "candle",
    externalUrl: row.external_url || undefined,
  }
}

/**
 * GET /api/main/search?q=...
 * Aggregates fragrances and formulas matching the query (Option B).
 * Public; no auth required.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()
  if (!q || q.length === 0) {
    return NextResponse.json({ fragranceOils: [], formulas: [] })
  }

  const term = `%${q}%`

  try {
    const [adminClient, anonClient] = await Promise.all([
      createAdminClient(),
      createClient(),
    ])

    const [oilsRes, formulasRes] = await Promise.all([
      adminClient
        .from("fragrance_oils")
        .select("*, notion_url, image_url, image_source, allergen_statement")
        .or(`name.ilike.${term},description.ilike.${term},family.ilike.${term}`)
        .order("name")
        .limit(50),
      anonClient
        .from("formulas")
        .select(
          `
          id, name, slug, description, category_id, total_weight_g, source, external_url, tags,
          formula_phases (id, sort_order, name, formula_ingredients (id, sort_order, name, function, percentage, is_fragrance_oil))
        `
        )
        .or(`name.ilike.${term},description.ilike.${term}`)
        .order("name")
        .limit(50),
    ])

    const fragranceOils: FragranceOil[] = (oilsRes.data ?? []).map((row) => {
      const oil = dbRowToFragranceOil(row as Parameters<typeof dbRowToFragranceOil>[0])
      if (oil.imageUrl) {
        try {
          const thumbnailUrl = getThumbnailUrlFromPublicUrl(adminClient, oil.imageUrl)
          return { ...oil, thumbnailUrl }
        } catch {
          return oil
        }
      }
      return oil
    })

    const formulas: Formula[] = (formulasRes.data ?? []).map((row) =>
      formulaRowToFormula(row as FormulaRow)
    )

    return NextResponse.json({ fragranceOils, formulas })
  } catch (e) {
    console.error("Main search error:", e)
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    )
  }
}
