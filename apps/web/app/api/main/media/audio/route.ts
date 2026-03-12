import { NextResponse } from "next/server"
import { getMainMediaAudio } from "@/lib/main-media-data"

export type { MainMediaAudioTrack } from "@/lib/main-media-data"

/**
 * GET: Public list of Main audio tracks for /main/media (subset of verse_music_playlist).
 * No auth required.
 */
export async function GET() {
  const tracks = await getMainMediaAudio()
  return NextResponse.json({ tracks })
}
