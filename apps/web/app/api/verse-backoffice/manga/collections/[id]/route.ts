import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireInternalApiKey } from "@/lib/api/internal-auth"
import { pushMangaCollectionToNotion } from "@/lib/notion"

async function requireMangaAdmin(request: NextRequest): Promise<boolean> {
  if (requireInternalApiKey(request)) return true
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.rpc("is_admin")
  return data === true
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireMangaAdmin(request))) {
    return NextResponse.json(
      { error: "Unauthorized. Use MOODMNKY_API_KEY or admin session." },
      { status: 401 }
    )
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Missing collection id" }, { status: 400 })
  }

  let body: { name?: string; slug?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name
  if (body.slug !== undefined) updates.slug = body.slug

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: collection, error: updateError } = await supabase
    .from("mnky_collections")
    .update(updates)
    .eq("id", id)
    .select("id, notion_id, name, slug")
    .single()

  if (updateError) {
    if (updateError.code === "23505") {
      return NextResponse.json(
        { error: "Slug already in use by another collection." },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: updateError.message ?? "Update failed" },
      { status: 400 }
    )
  }

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 })
  }

  if (collection.notion_id) {
    try {
      await pushMangaCollectionToNotion(
        collection.notion_id,
        collection.name,
        collection.slug ?? ""
      )
    } catch {
      // Log but do not fail the PATCH
    }
  }

  return NextResponse.json(collection)
}
