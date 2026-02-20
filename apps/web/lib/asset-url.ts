/**
 * Unified asset URL builder for MOOD MNKY LABZ.
 * Provides consistent access to thumbnail, medium, and full asset URLs.
 */

import type { MediaAsset } from "@/lib/supabase/storage"
import { parseSupabaseStorageUrl } from "@/lib/supabase/storage"

export type AssetPreset = "thumbnail" | "medium" | "full"

/** Transform params for Supabase Storage image transformation (Pro plan). */
const PRESETS: Record<
  AssetPreset,
  { width?: number; height?: number; quality?: number; format?: string; resize?: string }
> = {
  thumbnail: { width: 300, quality: 80, format: "webp", resize: "cover" },
  medium: { width: 800, quality: 85, format: "webp", resize: "contain" },
  full: {},
}

/**
 * Build a transformed URL from a Supabase storage public URL.
 * Client-safe: works with URLs only, no Supabase client needed.
 * Returns original URL if not a Supabase storage URL.
 */
export function getTransformedUrl(
  publicUrl: string,
  preset: AssetPreset = "full"
): string {
  if (preset === "full") return publicUrl

  if (!parseSupabaseStorageUrl(publicUrl)) return publicUrl

  try {
    const url = new URL(publicUrl)
    const transform = PRESETS[preset]
    const renderPath = url.pathname.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/"
    )
    const params = new URLSearchParams()
    if (transform.width) params.set("width", String(transform.width))
    if (transform.height) params.set("height", String(transform.height))
    if (transform.quality) params.set("quality", String(transform.quality))
    if (transform.format) params.set("format", transform.format)
    if (transform.resize) params.set("resize", transform.resize)
    return `${url.origin}${renderPath}?${params.toString()}`
  } catch {
    return publicUrl
  }
}

/**
 * Get the best display URL for an asset based on preset.
 * Uses API-enriched thumbnail_url/medium_url when available, otherwise builds from public_url.
 */
export function getAssetUrl(
  asset: Pick<MediaAsset, "public_url" | "thumbnail_url" | "medium_url" | "mime_type">,
  preset: AssetPreset = "full"
): string | null {
  const url = asset.public_url
  if (!url) return null

  if (preset === "thumbnail" && asset.thumbnail_url) return asset.thumbnail_url
  if (preset === "medium" && asset.medium_url) return asset.medium_url

  if (!asset.mime_type?.startsWith("image/")) return url

  return getTransformedUrl(url, preset)
}
