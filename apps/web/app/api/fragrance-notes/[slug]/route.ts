import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { FragranceNote, FragranceOil, FragranceFamily } from "@/lib/types"

function dbRowToFragranceNote(row: {
  id: string
  name: string
  slug: string
  description_short: string | null
  olfactive_profile: string | null
  facts: string | null
  created_at: string
  updated_at: string
}): FragranceNote {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    descriptionShort: row.description_short ?? "",
    olfactiveProfile: row.olfactive_profile ?? "",
    facts: row.facts ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function dbRowToFragranceOil(row: {
  id: string
  name: string
  family: string | null
  top_notes: string[] | null
  middle_notes: string[] | null
  base_notes: string[] | null
}): Pick<FragranceOil, "id" | "name" | "family" | "topNotes" | "middleNotes" | "baseNotes"> {
  return {
    id: row.id,
    name: row.name,
    family: (row.family ?? "Floral") as FragranceFamily,
    topNotes: row.top_notes ?? [],
    middleNotes: row.middle_notes ?? [],
    baseNotes: row.base_notes ?? [],
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: noteRow, error: noteError } = await supabase
    .from("fragrance_notes")
    .select("id, name, slug, description_short, olfactive_profile, facts, created_at, updated_at")
    .eq("slug", slug)
    .single()

  if (noteError || !noteRow) {
    return NextResponse.json(
      { error: "Fragrance note not found" },
      { status: 404 }
    )
  }

  const note = dbRowToFragranceNote(noteRow)
  const noteName = noteRow.name

  const arrVal = `{${JSON.stringify(noteName)}}`
  const { data: oilRows, error: oilError } = await supabase
    .from("fragrance_oils")
    .select("id, name, family, top_notes, middle_notes, base_notes")
    .or(`top_notes.cs.${arrVal},middle_notes.cs.${arrVal},base_notes.cs.${arrVal}`)
    .order("name")

  if (oilError) {
    return NextResponse.json(
      { note, fragranceOils: [] },
      { status: 200 }
    )
  }

  const fragranceOils = (oilRows ?? []).map(dbRowToFragranceOil)

  return NextResponse.json({
    note,
    fragranceOils,
  })
}
