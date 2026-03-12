import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient, getSupabaseConfigMissing } from "@/lib/supabase/admin"

export type MainAudioLibraryTrack = {
  id: string
  public_url: string | null
  audio_title: string | null
  audio_artist: string | null
  file_name: string
  duration_seconds: number | null
  sort_order: number
}

/**
 * GET: Returns the Main audio library (verse_music_playlist + media_assets).
 * Admin-only so LABZ can choose a default track for Main; uses admin client to read across users.
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
    return NextResponse.json({ tracks: [] })
  }

  const { data: playlistRows, error: playlistError } = await admin
    .from("verse_music_playlist")
    .select("media_asset_id, sort_order")
    .order("sort_order", { ascending: true })

  if (playlistError) {
    console.error("Main audio-library playlist error:", playlistError)
    return NextResponse.json({ error: "Failed to load playlist" }, { status: 500 })
  }

  if (!playlistRows?.length) {
    return NextResponse.json({ tracks: [] })
  }

  const assetIds = playlistRows.map((r) => r.media_asset_id)
  const { data: assets, error: assetsError } = await admin
    .from("media_assets")
    .select("id, public_url, audio_title, audio_artist, file_name, duration_seconds")
    .in("id", assetIds)

  if (assetsError) {
    console.error("Main audio-library assets error:", assetsError)
    return NextResponse.json({ error: "Failed to load tracks" }, { status: 500 })
  }

  const assetMap = new Map((assets ?? []).map((a) => [a.id, a]))
  const tracks: MainAudioLibraryTrack[] = playlistRows
    .map((r) => {
      const asset = assetMap.get(r.media_asset_id)
      if (!asset) return null
      return {
        id: asset.id,
        public_url: asset.public_url ?? null,
        audio_title: asset.audio_title ?? null,
        audio_artist: asset.audio_artist ?? null,
        file_name: asset.file_name,
        duration_seconds: asset.duration_seconds ?? null,
        sort_order: r.sort_order,
      }
    })
    .filter((t): t is MainAudioLibraryTrack => t !== null)

  return NextResponse.json({ tracks })
}
