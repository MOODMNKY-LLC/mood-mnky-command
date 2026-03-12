import { NextResponse } from "next/server"
import { getJellyfinFeaturedItems } from "@/lib/main-media-data"

/**
 * GET: Featured Jellyfin items (movies/series) for Main Media page. Public.
 */
export async function GET() {
  const items = await getJellyfinFeaturedItems(undefined, { limit: 6 })
  return NextResponse.json({ items })
}
