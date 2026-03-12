import { NextRequest, NextResponse } from "next/server"
import { getMainMediaGallery } from "@/lib/main-media-data"

export type { MainMediaGalleryItem } from "@/lib/main-media-data"

const DEFAULT_LIMIT = 12

/**
 * GET: Random gallery items with AI descriptions for /main/media. Public.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get("limit")) || DEFAULT_LIMIT, 24)
  const items = await getMainMediaGallery(limit)
  return NextResponse.json({ items })
}
