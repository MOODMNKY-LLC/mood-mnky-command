import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { Formula, Phase, Ingredient } from "@/lib/types"
import { formulaToHtml } from "@/lib/formula-to-pdf"
import { htmlToPdf } from "@/lib/adobe/pdf-services"

export const maxDuration = 60

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

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "Formula ID required" }, { status: 400 })

  const { data, error } = await supabase
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
    .or(`id.eq.${id},slug.eq.${id}`)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Formula not found" },
      { status: 404 }
    )
  }

  try {
    const formula = dbRowToFormula(data)
    const html = formulaToHtml(formula)
    const pdfBuffer = await htmlToPdf(html)
    const fileName = `${formula.name.replace(/[^a-zA-Z0-9]/g, "_")}_formula.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (err) {
    console.error("Formula PDF export error:", err)
    const message = err instanceof Error ? err.message : "PDF export failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
