import { NextResponse } from "next/server"
import { getJellyfinFeaturedBooks } from "@/lib/main-media-data"

/**
 * GET: Featured Jellyfin books for Main Media page. Public.
 */
export async function GET() {
  const items = await getJellyfinFeaturedBooks(undefined, { limit: 6 })
  return NextResponse.json({ items })
}
