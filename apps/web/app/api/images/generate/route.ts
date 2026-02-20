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
import { getImageProvider } from "@/lib/image-providers"

export const maxDuration = 90

interface GenerateBody {
  prompt: string
  /** Multiple reference images. Order: [0] = subject to edit, [1] = style reference. */
  referenceImageUrls?: string[]
  /** Single reference (backward compat). Merged into referenceImageUrls when present. */
  referenceImageUrl?: string
  fragranceId?: string
  fragranceName?: string
  shopifyProductId?: number
  shopifyImageId?: number
  model?: string
  size?: string
  quality?: string
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

  const { prompt, referenceImageUrls, referenceImageUrl, fragranceId, fragranceName, shopifyProductId, shopifyImageId, model, size, quality } = body
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 })
  }

  const referenceUrls = referenceImageUrls?.length
    ? referenceImageUrls
    : referenceImageUrl
      ? [referenceImageUrl]
      : []

  const imageProvider = getImageProvider()
  const sourceModel = model ?? "gpt-image-1.5"

  try {
    let b64: string
    if (referenceUrls.length > 0 && imageProvider.edit) {
      b64 = await imageProvider.edit({
        prompt,
        referenceImageUrls: referenceUrls,
        model,
        size,
        quality,
      })
    } else if (referenceUrls.length > 0 && !imageProvider.edit) {
      return NextResponse.json(
        { error: `${imageProvider.name} does not support reference image edit; use openai provider` },
        { status: 400 }
      )
    } else {
      b64 = await imageProvider.generate({ prompt, model, size, quality })
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
    if (shopifyProductId != null) tags.push("shopify-product")

    const asset = await saveMediaAsset(adminSupabase, {
      user_id: user.id,
      bucket_id: BUCKETS.aiGenerations as BucketId,
      storage_path: path,
      file_name: fileName,
      mime_type: "image/png",
      file_size: buffer.length,
      tags,
      public_url: publicUrl,
      linked_entity_type: shopifyProductId != null ? "shopify_product" : fragranceId ? "fragrance" : undefined,
      linked_entity_id: shopifyProductId != null ? String(shopifyProductId) : fragranceId,
      category: shopifyProductId != null ? "product-edit" : "fragrance-scene",
      source_model: sourceModel,
      generation_prompt: prompt,
      shopify_product_id: shopifyProductId,
      shopify_image_id: shopifyImageId,
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
