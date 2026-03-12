import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  uploadFile,
  saveMediaAsset,
  getPublicUrl,
  BUCKETS,
  type BucketId,
} from "@/lib/supabase/storage"

/**
 * Upload an image from a URL to Supabase storage and record in media_assets.
 * Used by n8n and other server-side workflows.
 * Auth: x-api-key header must match MEDIA_API_KEY (or legacy CDN_API_KEY); userId is required in body.
 */
export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key")
  const mediaKey = process.env.MEDIA_API_KEY || process.env.CDN_API_KEY
  if (!mediaKey || apiKey !== mediaKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: {
    url: string
    bucket?: BucketId
    userId: string
    tags?: string[]
    linkedEntityType?: string
    linkedEntityId?: string
    category?: string
    fileName?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { url, bucket = "ai-generations", userId, tags, linkedEntityType, linkedEntityId, category, fileName } = body
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 })
  }
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required for attribution" }, { status: 400 })
  }

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`)

    const contentType = res.headers.get("content-type") || "image/png"
    const blob = await res.blob()
    const timestamp = Date.now()
    const inferredName = fileName || `upload_${timestamp}.${contentType.includes("webp") ? "webp" : contentType.includes("jpeg") ? "jpg" : "png"}`

    const supabase = createAdminClient()
    const { path } = await uploadFile(
      supabase,
      bucket as BucketId,
      userId,
      inferredName,
      blob,
      { contentType, upsert: true }
    )

    const publicUrl = getPublicUrl(supabase, bucket as BucketId, path)

    const asset = await saveMediaAsset(supabase, {
      user_id: userId,
      bucket_id: bucket as BucketId,
      storage_path: path,
      file_name: inferredName,
      mime_type: contentType,
      file_size: blob.size,
      tags: tags ?? [],
      public_url: publicUrl,
      linked_entity_type: linkedEntityType,
      linked_entity_id: linkedEntityId,
      category,
    })

    return NextResponse.json({
      asset,
      publicUrl,
    })
  } catch (err) {
    console.error("Upload from URL error:", err)
    const message = err instanceof Error ? err.message : "Upload failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
