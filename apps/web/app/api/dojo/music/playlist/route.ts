import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * PATCH: Save user's Dojo mini playlist.
 * Body: { trackIds: string[] }
 * Validates IDs exist in verse_music_playlist. Empty array = use full playlist.
 */
export async function PATCH(req: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { trackIds?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const trackIds = Array.isArray(body.trackIds) ? body.trackIds.filter(Boolean) : []

  // Empty = use full playlist; store null
  if (trackIds.length === 0) {
    const { error } = await supabase
      .from("profiles")
      .update({ dojo_playlist_track_ids: null })
      .eq("id", user.id)

    if (error) {
      console.error("Dojo playlist PATCH clear error:", error)
      return NextResponse.json({ error: "Failed to update playlist" }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  // Validate all IDs exist in verse_music_playlist
  const { data: valid } = await admin
    .from("verse_music_playlist")
    .select("media_asset_id")
    .in("media_asset_id", trackIds)

  const validIds = new Set((valid ?? []).map((r) => r.media_asset_id))
  const filtered = trackIds.filter((id) => validIds.has(id))

  if (filtered.length !== trackIds.length) {
    return NextResponse.json(
      { error: "Some track IDs are not in the MNKY DOJO playlist" },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from("profiles")
    .update({ dojo_playlist_track_ids: filtered })
    .eq("id", user.id)

  if (error) {
    console.error("Dojo playlist PATCH error:", error)
    return NextResponse.json({ error: "Failed to update playlist" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
