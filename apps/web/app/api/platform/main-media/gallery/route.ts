import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient, getSupabaseConfigMissing } from "@/lib/supabase/admin"

export type MainMediaGalleryAdminItem = {
  id: string
  media_asset_id: string
  sort_order: number
  ai_description: string | null
  file_name: string
  public_url: string | null
}

/**
 * GET: List all main_media_gallery entries (admin). Ordered by sort_order.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single()
  const isAdmin = profile?.role === "admin" || profile?.is_admin === true
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (getSupabaseConfigMissing()) {
    return NextResponse.json({ items: [] })
  }
  const { data: rows, error } = await admin
    .from("main_media_gallery")
    .select("id, media_asset_id, sort_order, ai_description")
    .order("sort_order", { ascending: true })
  if (error) {
    console.error("Main media gallery admin list error:", error)
    return NextResponse.json({ error: "Failed to load" }, { status: 500 })
  }
  if (!rows?.length) {
    return NextResponse.json({ items: [] })
  }
  const assetIds = rows.map((r) => r.media_asset_id)
  const { data: assets, error: assetsError } = await admin
    .from("media_assets")
    .select("id, file_name, public_url")
    .in("id", assetIds)
  if (assetsError) {
    return NextResponse.json({ error: "Failed to load assets" }, { status: 500 })
  }
  const assetMap = new Map((assets ?? []).map((a) => [a.id, a]))
  const items: MainMediaGalleryAdminItem[] = rows.map((row) => {
    const asset = assetMap.get(row.media_asset_id)
    return {
      id: row.id,
      media_asset_id: row.media_asset_id,
      sort_order: row.sort_order,
      ai_description: row.ai_description ?? null,
      file_name: asset?.file_name ?? "",
      public_url: asset?.public_url ?? null,
    }
  })
  return NextResponse.json({ items })
}

/**
 * POST: Add a gallery entry. Body: { media_asset_id: string, sort_order?: number }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single()
  const isAdmin = profile?.role === "admin" || profile?.is_admin === true
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (getSupabaseConfigMissing()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
  }
  let body: { media_asset_id?: string; sort_order?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const media_asset_id = body.media_asset_id
  if (!media_asset_id || typeof media_asset_id !== "string") {
    return NextResponse.json(
      { error: "media_asset_id is required" },
      { status: 400 }
    )
  }
  const { data: max } = await admin
    .from("main_media_gallery")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single()
  const sort_order =
    body.sort_order ?? (typeof max?.sort_order === "number" ? max.sort_order + 1 : 0)
  const { data: inserted, error } = await admin
    .from("main_media_gallery")
    .insert({ media_asset_id, sort_order })
    .select("id, media_asset_id, sort_order, ai_description")
    .single()
  if (error) {
    if (error.code === "23503") {
      return NextResponse.json(
        { error: "Media asset not found" },
        { status: 400 }
      )
    }
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "This asset is already in the gallery" },
        { status: 409 }
      )
    }
    console.error("Main media gallery insert error:", error)
    return NextResponse.json({ error: "Failed to add" }, { status: 500 })
  }
  return NextResponse.json(inserted)
}
