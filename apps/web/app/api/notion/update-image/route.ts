import { NextResponse } from "next/server"
import { updateFragrancePage } from "@/lib/notion"

/**
 * Update a Notion page's image URL property.
 * Used by n8n and Studio workflow to sync generated image URLs to Notion.
 * Auth: x-api-key header must match MEDIA_API_KEY (or legacy CDN_API_KEY), or authenticated user.
 */
export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key")
  const mediaKey = process.env.MEDIA_API_KEY || process.env.CDN_API_KEY
  const useApiKey = mediaKey && apiKey === mediaKey

  if (!useApiKey) {
    // If no API key auth, require Supabase auth
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { notionPageId: string; imageUrl: string; propertyName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { notionPageId, imageUrl } = body
  if (!notionPageId || typeof notionPageId !== "string") {
    return NextResponse.json({ error: "notionPageId is required" }, { status: 400 })
  }
  if (!imageUrl || typeof imageUrl !== "string") {
    return NextResponse.json({ error: "imageUrl is required" }, { status: 400 })
  }

  try {
    await updateFragrancePage(notionPageId, { imageUrl })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Notion update-image error:", err)
    const message = err instanceof Error ? err.message : "Update failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
