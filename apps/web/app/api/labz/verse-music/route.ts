import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401 }
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single()
  const isAdmin = profile?.role === "admin" || profile?.is_admin === true
  if (!isAdmin) return { ok: false as const, status: 403 }
  return { ok: true as const, admin }
}

/**
 * GET: List verse music playlist (admin). Returns playlist entries with joined media_assets.
 */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status })
  const { admin } = auth

  const { data: playlistRows, error: playlistError } = await admin
    .from("verse_music_playlist")
    .select("id, media_asset_id, sort_order")
    .order("sort_order", { ascending: true })

  if (playlistError) {
    console.error("Labz verse-music GET error:", playlistError)
    return NextResponse.json({ error: "Failed to load" }, { status: 500 })
  }

  if (!playlistRows?.length) {
    return NextResponse.json({ playlist: [], assets: [] })
  }

  const assetIds = playlistRows.map((r) => r.media_asset_id)
  const { data: assets, error: assetsError } = await admin
    .from("media_assets")
    .select("*")
    .in("id", assetIds)

  if (assetsError) {
    console.error("Labz verse-music assets error:", assetsError)
    return NextResponse.json({ error: "Failed to load assets" }, { status: 500 })
  }

  const assetMap = new Map((assets ?? []).map((a) => [a.id, a]))
  const playlist = playlistRows.map((r) => ({
    id: r.id,
    media_asset_id: r.media_asset_id,
    sort_order: r.sort_order,
    asset: assetMap.get(r.media_asset_id),
  }))

  return NextResponse.json({ playlist })
}

/**
 * POST: Add track to playlist (admin). Body: { media_asset_id }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status })
  const { admin } = auth

  let body: { media_asset_id: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const { media_asset_id } = body
  if (!media_asset_id) {
    return NextResponse.json({ error: "media_asset_id required" }, { status: 400 })
  }

  const { data: max } = await admin
    .from("verse_music_playlist")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const sortOrder = (max?.sort_order ?? -1) + 1

  const { data, error } = await admin
    .from("verse_music_playlist")
    .insert({ media_asset_id, sort_order: sortOrder })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Track already in playlist" }, { status: 409 })
    }
    console.error("Labz verse-music POST error:", error)
    return NextResponse.json({ error: "Failed to add" }, { status: 500 })
  }

  return NextResponse.json({ item: data })
}

/**
 * DELETE: Remove track from playlist (admin). Body: { media_asset_id } or ?media_asset_id=
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status })
  const { admin } = auth

  const url = new URL(request.url)
  let mediaAssetId = url.searchParams.get("media_asset_id")
  if (!mediaAssetId) {
    try {
      const body = await request.json()
      mediaAssetId = (body as { media_asset_id?: string }).media_asset_id
    } catch {
      // ignore
    }
  }
  if (!mediaAssetId) {
    return NextResponse.json({ error: "media_asset_id required" }, { status: 400 })
  }

  const { error } = await admin
    .from("verse_music_playlist")
    .delete()
    .eq("media_asset_id", mediaAssetId)

  if (error) {
    console.error("Labz verse-music DELETE error:", error)
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

/**
 * PATCH: Reorder track (admin). Body: { media_asset_id, sort_order }
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.status })
  const { admin } = auth

  let body: { media_asset_id: string; sort_order: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const { media_asset_id, sort_order } = body
  if (!media_asset_id || typeof sort_order !== "number") {
    return NextResponse.json({ error: "media_asset_id and sort_order required" }, { status: 400 })
  }

  const { error } = await admin
    .from("verse_music_playlist")
    .update({ sort_order })
    .eq("media_asset_id", media_asset_id)

  if (error) {
    console.error("Labz verse-music PATCH error:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
