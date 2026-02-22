import { NextResponse } from "next/server"
import { getMainFeaturedFragrances } from "@/lib/main-landing-data"

/**
 * GET /api/main/featured-fragrances
 * Returns a limited set of fragrance oils for Main "Featured" strip (e.g. on /main/fragrances).
 * Public; no auth required.
 */
export async function GET() {
  try {
    const featuredFragrances = await getMainFeaturedFragrances()
    return NextResponse.json({ featuredFragrances })
  } catch (e) {
    console.error("Featured fragrances error:", e)
    return NextResponse.json(
      { error: "Failed to load featured fragrances" },
      { status: 500 }
    )
  }
}
