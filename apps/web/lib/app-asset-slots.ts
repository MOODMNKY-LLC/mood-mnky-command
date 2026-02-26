import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Resolve image URLs for Main → Services slots.
 * Returns a map of service id (e.g. "mnky-cloud") to public URL.
 * Used by Main services page and detail; fallback to bundleImageUrl or placeholder when missing.
 * Uses admin client so we can read media_assets (RLS restricts anon to own rows).
 */
export async function getMainServiceImageUrls(): Promise<Record<string, string>> {
  const supabase = createAdminClient()
  const { data: rows, error } = await supabase
    .from("app_asset_slots")
    .select(
      `
      slot_key,
      media_assets (
        public_url
      )
    `
    )
    .eq("category", "main-services")

  if (error) {
    console.warn("[getMainServiceImageUrls]", error.message)
    return {}
  }

  const map: Record<string, string> = {}
  for (const row of rows ?? []) {
    const slotKey = row.slot_key as string
    const serviceId = slotKey.replace(/^main\.services\./, "")
    if (!serviceId) continue
    const ma = Array.isArray(row.media_assets) ? row.media_assets[0] : row.media_assets
    const url = (ma as { public_url?: string } | null)?.public_url
    if (url) map[serviceId] = url
  }
  return map
}

/**
 * Resolve image URLs for Main → Community slots.
 * Returns a map of short key (hero, discord, blog, dojo) to public URL.
 * Used by /main/community; fallback to placeholder when missing.
 */
export async function getMainCommunityImageUrls(): Promise<Record<string, string>> {
  const supabase = createAdminClient()
  const { data: rows, error } = await supabase
    .from("app_asset_slots")
    .select(
      `
      slot_key,
      media_assets (
        public_url
      )
    `
    )
    .eq("category", "main-community")

  if (error) {
    console.warn("[getMainCommunityImageUrls]", error.message)
    return {}
  }

  const map: Record<string, string> = {}
  const prefix = "main.community."
  for (const row of rows ?? []) {
    const slotKey = row.slot_key as string
    if (!slotKey.startsWith(prefix)) continue
    const key = slotKey.slice(prefix.length)
    if (!key) continue
    const ma = Array.isArray(row.media_assets) ? row.media_assets[0] : row.media_assets
    const url = (ma as { public_url?: string } | null)?.public_url
    if (url) map[key] = url
  }
  return map
}
