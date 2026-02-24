import { createAdminClient, getSupabaseConfigMissing } from "@/lib/supabase/admin"
import { getPublicUrl } from "@/lib/supabase/storage"
import type { BucketId } from "@/lib/supabase/storage"
import { getJellyfinFeaturedItems } from "@/lib/services/jellyfin"

const PUBLIC_AUDIO_LIMIT = 24
const DEFAULT_GALLERY_LIMIT = 12

export type MainMediaAudioTrack = {
  id: string
  public_url: string | null
  audio_title: string | null
  audio_artist: string | null
  audio_album: string | null
  cover_art_url: string | null
  file_name: string
  duration_seconds: number | null
  sort_order: number
}

export type MainMediaGalleryItem = {
  id: string
  media_asset_id: string
  sort_order: number
  ai_description: string | null
  public_url: string | null
  file_name: string
}

export async function getMainMediaAudio(): Promise<MainMediaAudioTrack[]> {
  if (getSupabaseConfigMissing()) return []
  const admin = createAdminClient()
  const { data: playlistRows, error: playlistError } = await admin
    .from("verse_music_playlist")
    .select("media_asset_id, sort_order")
    .order("sort_order", { ascending: true })
    .limit(PUBLIC_AUDIO_LIMIT)

  if (playlistError || !playlistRows?.length) return []
  const assetIds = playlistRows.map((r) => r.media_asset_id)
  const { data: assets, error: assetsError } = await admin
    .from("media_assets")
    .select("id, public_url, audio_title, audio_artist, audio_album, file_name, duration_seconds, cover_art_url, cover_art_path, bucket_id")
    .in("id", assetIds)

  if (assetsError) return []
  const assetMap = new Map((assets ?? []).map((a) => [a.id, a]))
  return playlistRows
    .map((r) => {
      const asset = assetMap.get(r.media_asset_id)
      if (!asset) return null
      let cover_art_url = asset.cover_art_url ?? null
      if (!cover_art_url && asset.cover_art_path && asset.bucket_id) {
        try {
          cover_art_url = getPublicUrl(admin, asset.bucket_id as BucketId, asset.cover_art_path)
        } catch {
          // leave null
        }
      }
      return {
        id: asset.id,
        public_url: asset.public_url ?? null,
        audio_title: asset.audio_title ?? null,
        audio_artist: asset.audio_artist ?? null,
        audio_album: asset.audio_album ?? null,
        cover_art_url,
        file_name: asset.file_name,
        duration_seconds: asset.duration_seconds ?? null,
        sort_order: r.sort_order,
      }
    })
    .filter((t): t is MainMediaAudioTrack => t !== null)
}

export async function getMainMediaGallery(
  limit: number = DEFAULT_GALLERY_LIMIT
): Promise<MainMediaGalleryItem[]> {
  if (getSupabaseConfigMissing()) return []
  const cap = Math.min(limit, 24)
  const admin = createAdminClient()
  const { data: rows, error } = await admin
    .from("main_media_gallery")
    .select("id, media_asset_id, sort_order, ai_description")
    .order("sort_order", { ascending: true })
    .limit(cap * 2)

  if (error || !rows?.length) return []
  const shuffled = [...rows].sort(() => Math.random() - 0.5).slice(0, cap)
  const assetIds = shuffled.map((r) => r.media_asset_id)
  const { data: assets, error: assetsError } = await admin
    .from("media_assets")
    .select("id, public_url, file_name")
    .in("id", assetIds)

  if (assetsError) return []
  const assetMap = new Map((assets ?? []).map((a) => [a.id, a]))
  return shuffled
    .map((row) => {
      const asset = assetMap.get(row.media_asset_id)
      if (!asset) return null
      return {
        id: row.id,
        media_asset_id: row.media_asset_id,
        sort_order: row.sort_order,
        ai_description: row.ai_description ?? null,
        public_url: asset.public_url ?? null,
        file_name: asset.file_name ?? "",
      }
    })
    .filter((t): t is MainMediaGalleryItem => t !== null)
}

export { getJellyfinFeaturedItems, getJellyfinFeaturedBooks, getJellyfinFeaturedMusic } from "@/lib/services/jellyfin"
export type { JellyfinFeaturedItem } from "@/lib/services/jellyfin"
