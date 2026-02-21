import { NextResponse } from "next/server"
import { createAdminClient, getSupabaseConfigMissing } from "@/lib/supabase/admin"

/**
 * GET: Returns the Verse music playlist (admin-configured).
 * Public endpoint – no auth required.
 * Uses admin client to bypass RLS (playlist tracks may belong to any user).
 */
export async function GET() {
  const configMissing = getSupabaseConfigMissing()
  if (configMissing) {
    console.warn("Verse music: Supabase not configured:", configMissing)
    return NextResponse.json({ tracks: [] })
  }

  const supabase = createAdminClient()

  const { data: playlistRows, error: playlistError } = await supabase
    .from("verse_music_playlist")
    .select("media_asset_id, sort_order")
    .order("sort_order", { ascending: true })

  if (playlistError) {
    console.error("Verse music GET error:", playlistError)
    return NextResponse.json({ error: "Failed to load playlist" }, { status: 500 })
  }

  if (!playlistRows?.length) {
    return NextResponse.json({ tracks: [] })
  }

  const assetIds = playlistRows.map((r) => r.media_asset_id)
  const { data: assets, error: assetsError } = await supabase
    .from("media_assets")
    .select("id, storage_path, file_name, mime_type, file_size, public_url, audio_title, audio_artist, audio_album, cover_art_url, duration_seconds, created_at")
    .in("id", assetIds)

  if (assetsError) {
    console.error("Verse music assets error:", assetsError)
    return NextResponse.json({ error: "Failed to load tracks" }, { status: 500 })
  }

  const assetMap = new Map((assets ?? []).map((a) => [a.id, a]))
  const tracks = playlistRows
    .map((r) => assetMap.get(r.media_asset_id))
    .filter(Boolean)

  return NextResponse.json({ tracks })
}
