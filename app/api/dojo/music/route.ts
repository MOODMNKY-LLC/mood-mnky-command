import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const ASSET_SELECT =
  "id, storage_path, file_name, mime_type, file_size, public_url, audio_title, audio_artist, audio_album, cover_art_url, duration_seconds, created_at"

/**
 * GET: Returns Dojo music playlist for the authenticated user.
 * If user has dojo_playlist_track_ids set, returns that subset in order.
 * Else (or if unauthenticated) returns full Verse admin playlist.
 */
export async function GET() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Resolve playlist: user's mini playlist or full Verse playlist
  let trackIds: string[] | null = null
  if (user) {
    const { data: profile } = await admin
      .from("profiles")
      .select("dojo_playlist_track_ids")
      .eq("id", user.id)
      .single()
    const ids = profile?.dojo_playlist_track_ids
    if (Array.isArray(ids) && ids.length > 0) {
      trackIds = ids.map(String)
    }
  }

  if (!trackIds || trackIds.length === 0) {
    // Fall back to full Verse playlist (same as GET /api/verse/music)
    const { data: playlistRows, error: playlistError } = await admin
      .from("verse_music_playlist")
      .select("media_asset_id, sort_order")
      .order("sort_order", { ascending: true })

    if (playlistError) {
      console.error("Dojo music GET verse error:", playlistError)
      return NextResponse.json({ error: "Failed to load playlist" }, { status: 500 })
    }

    if (!playlistRows?.length) {
      return NextResponse.json({ tracks: [] })
    }

    trackIds = playlistRows.map((r) => r.media_asset_id)
  }

  const { data: assets, error: assetsError } = await admin
    .from("media_assets")
    .select(ASSET_SELECT)
    .in("id", trackIds)

  if (assetsError) {
    console.error("Dojo music assets error:", assetsError)
    return NextResponse.json({ error: "Failed to load tracks" }, { status: 500 })
  }

  const assetMap = new Map((assets ?? []).map((a) => [a.id, a]))
  const tracks = trackIds
    .map((id) => assetMap.get(id))
    .filter(Boolean)

  return NextResponse.json({ tracks })
}
