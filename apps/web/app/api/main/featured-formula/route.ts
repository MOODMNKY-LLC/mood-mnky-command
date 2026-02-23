import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { Formula } from "@/lib/types"

/**
 * GET /api/main/featured-formula
 * Returns one formula for the Main formulas page hero (seasonal rotation by month).
 * Public; no auth required.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: rows, error } = await supabase
      .from("formulas")
      .select(
        `
        id,
        name,
        slug,
        description,
        category_id,
        total_weight_g,
        source,
        external_url,
        tags,
        formula_phases (
          id,
          sort_order,
          name,
          formula_ingredients (
            id,
            sort_order,
            name,
            function,
            percentage,
            is_fragrance_oil
          )
        )
      `
      )
      .order("name")
      .limit(100)

    if (error || !rows || rows.length === 0) {
      return NextResponse.json({ featuredFormula: null })
    }

    const monthIndex = new Date().getMonth()
    const index = monthIndex % rows.length
    const row = rows[index] as (typeof rows)[number]
    const formula = dbRowToFormula(row)
    return NextResponse.json({ featuredFormula: formula })
  } catch (e) {
    console.error("Featured formula error:", e)
    return NextResponse.json(
      { error: "Failed to load featured formula" },
      { status: 500 }
    )
  }
}

function dbRowToFormula(row: {
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
}): Formula {
  const phases = (row.formula_phases || [])
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
    .map((p: {
      id: string
      name: string
      formula_ingredients: Array<{
        id: string
        sort_order: number
        name: string
        function: string | null
        percentage: number
        is_fragrance_oil: boolean
      }>
    }) => ({
      id: p.id,
      name: p.name,
      ingredients: (p.formula_ingredients || [])
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((i: {
          id: string
          name: string
          function: string | null
          percentage: number
          is_fragrance_oil: boolean
        }) => ({
          id: i.id,
          name: i.name,
          function: i.function || "See tutorial",
          percentage: i.percentage,
          isFragranceOil: i.is_fragrance_oil,
        })),
    }))

  const categoryToProductType: Record<string, Formula["productType"]> = {
    skincare: "skincare",
    haircare: "haircare",
    diy: "body-butter",
    candle: "candle",
  }

  return {
    id: row.id,
    name: row.name,
    productType: categoryToProductType[row.category_id] || "skincare",
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
