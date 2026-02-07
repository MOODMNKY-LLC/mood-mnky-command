import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { Formula, Phase, Ingredient } from "@/lib/types"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const slug = searchParams.get("slug")

  const supabase = await createClient()

  let query = supabase
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

  if (category) {
    query = query.eq("category_id", category)
  }
  if (slug) {
    query = query.eq("slug", slug).single()
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (slug && data) {
    const formula = dbRowToFormula(data)
    return NextResponse.json({ formula })
  }

  const formulas = Array.isArray(data) ? data.map(dbRowToFormula) : []
  return NextResponse.json({ formulas })
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
  const phases: Phase[] = (row.formula_phases || [])
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
        })) as Ingredient[],
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

function mapCategoryToProductType(categoryId: string): Formula["productType"] {
  const map: Record<string, Formula["productType"]> = {
    skincare: "skincare",
    haircare: "haircare",
    diy: "body-butter",
    candle: "candle",
  }
  return map[categoryId] || "skincare"
}
