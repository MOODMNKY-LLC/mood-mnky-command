import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { FragranceNote } from "@/lib/types"

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

export async function GET(request: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const letter = searchParams.get("letter")?.toUpperCase()
  const q = searchParams.get("q")?.trim()

  let query = supabase
    .from("fragrance_notes")
    .select("id, name, slug, description_short, olfactive_profile, facts, created_at, updated_at")
    .order("name")

  if (letter && letter.length === 1) {
    query = query.ilike("name", `${letter}%`)
  }

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,description_short.ilike.%${q}%,olfactive_profile.ilike.%${q}%,facts.ilike.%${q}%`
    )
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const notes = (data ?? []).map(dbRowToFragranceNote)

  return NextResponse.json({
    notes,
    total: notes.length,
  })
}
