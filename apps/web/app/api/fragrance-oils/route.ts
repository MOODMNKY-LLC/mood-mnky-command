import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getThumbnailUrlFromPublicUrl } from "@/lib/supabase/storage"
import { dbRowToFragranceOil } from "@/lib/fragrance-oils-db"
import type { FragranceOil } from "@/lib/types"

function filterBySearch(oils: FragranceOil[], q: string): FragranceOil[] {
  const term = q.trim().toLowerCase()
  if (!term) return oils
  return oils.filter(
    (oil) =>
      oil.name.toLowerCase().includes(term) ||
      (oil.description && oil.description.toLowerCase().includes(term)) ||
      oil.family.toLowerCase().includes(term) ||
      oil.subfamilies.some((f) => f.toLowerCase().includes(term))
  )
}

export async function GET(request: Request) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") ?? ""

  const { data, error } = await supabase
    .from("fragrance_oils")
    .select("*, notion_url, image_url, image_source, allergen_statement")
    .order("name")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let fragranceOils = (data ?? []).map((row) =>
    dbRowToFragranceOil(row as Parameters<typeof dbRowToFragranceOil>[0])
  ) as FragranceOil[]

  fragranceOils = filterBySearch(fragranceOils, q)

  // Add thumbnailUrl for Supabase storage images (optimized 300px for display)
  const enriched = fragranceOils.map((oil) => {
    if (oil.imageUrl) {
      try {
        const thumbnailUrl = getThumbnailUrlFromPublicUrl(supabase, oil.imageUrl)
        return { ...oil, thumbnailUrl }
      } catch {
        return oil
      }
    }
    return oil
  })

  return NextResponse.json({
    fragranceOils: enriched,
    total: enriched.length,
  })
}
