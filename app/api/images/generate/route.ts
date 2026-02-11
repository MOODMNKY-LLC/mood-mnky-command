import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  uploadFile,
  saveMediaAsset,
  getPublicUrl,
  getThumbnailUrl,
  getMediumUrl,
  BUCKETS,
  type BucketId,
} from "@/lib/supabase/storage"
import { generateImage, editImage } from "@/lib/openai/images"
import type { ImageModel, ImageSize, ImageQuality } from "@/lib/openai/images"

export const maxDuration = 60

interface GenerateBody {
  prompt: string
  referenceImageUrl?: string
  fragranceId?: string
  fragranceName?: string
  model?: ImageModel
  size?: ImageSize
  quality?: ImageQuality
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: GenerateBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { prompt, referenceImageUrl, fragranceId, fragranceName, model, size, quality } = body
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 })
  }

  try {
    let b64: string
    if (referenceImageUrl) {
      b64 = await editImage({
        prompt,
        referenceImageUrl,
        model,
        size,
        quality,
      })
    } else {
      b64 = await generateImage({
        prompt,
        model,
        size,
        quality,
      })
    }

    const buffer = Buffer.from(b64, "base64")
    const blob = new Blob([buffer], { type: "image/png" })
    const timestamp = Date.now()
    const fileName = `gen_${timestamp}_${fragranceName?.replace(/[^a-zA-Z0-9]/g, "_") || "scene"}.png`

    const adminSupabase = createAdminClient()
    const { path } = await uploadFile(
      adminSupabase,
      BUCKETS.aiGenerations as BucketId,
      user.id,
      fileName,
      blob,
      { contentType: "image/png", upsert: true }
    )

    const publicUrl = getPublicUrl(adminSupabase, BUCKETS.aiGenerations as BucketId, path)

    const tags = ["ai-generated"]
    if (fragranceName) tags.push(fragranceName.replace(/\s+/g, "-").toLowerCase())

    const asset = await saveMediaAsset(adminSupabase, {
      user_id: user.id,
      bucket_id: BUCKETS.aiGenerations as BucketId,
      storage_path: path,
      file_name: fileName,
      mime_type: "image/png",
      file_size: buffer.length,
      tags,
      public_url: publicUrl,
      linked_entity_type: fragranceId ? "fragrance" : undefined,
      linked_entity_id: fragranceId,
      category: "fragrance-scene",
      source_model: model ?? "gpt-image-1.5",
      generation_prompt: prompt,
    })

    const thumbnailUrl = getThumbnailUrl(adminSupabase, BUCKETS.aiGenerations as BucketId, path)
    const mediumUrl = getMediumUrl(adminSupabase, BUCKETS.aiGenerations as BucketId, path)

    return NextResponse.json({
      asset: { ...asset, thumbnail_url: thumbnailUrl, medium_url: mediumUrl },
      publicUrl,
    })
  } catch (err) {
    console.error("Image generation error:", err)
    const message = err instanceof Error ? err.message : "Image generation failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
