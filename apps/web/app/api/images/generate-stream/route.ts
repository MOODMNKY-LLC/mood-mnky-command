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
import { generateImageStream, editImageStream } from "@/lib/openai/images"

export const maxDuration = 90

interface GenerateBody {
  prompt: string
  referenceImageUrls?: string[]
  referenceImageUrl?: string
  fragranceId?: string
  fragranceName?: string
  shopifyProductId?: number
  shopifyImageId?: number
  model?: string
  size?: string
  quality?: string
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    })
  }

  let body: GenerateBody
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
    })
  }

  const {
    prompt,
    referenceImageUrls,
    referenceImageUrl,
    fragranceId,
    fragranceName,
    shopifyProductId,
    shopifyImageId,
    model,
    size,
    quality,
  } = body

  if (!prompt || typeof prompt !== "string") {
    return new Response(JSON.stringify({ error: "prompt is required" }), {
      status: 400,
    })
  }

  const referenceUrls = referenceImageUrls?.length
    ? referenceImageUrls
    : referenceImageUrl
      ? [referenceImageUrl]
      : []

  const imageProvider = getImageProvider()
  const sourceModel = model ?? "gpt-image-1.5"

  // Streaming requires OpenAI provider
  if (referenceUrls.length > 0 && imageProvider.id !== "openai") {
    return new Response(
      JSON.stringify({
        error: "Streaming is only available with OpenAI provider. Use the non-streaming endpoint or switch provider.",
      }),
      { status: 400 }
    )
  }

  if (referenceUrls.length > 0 && !imageProvider.edit) {
    return new Response(
      JSON.stringify({
        error: `${imageProvider.name} does not support reference image edit`,
      }),
      { status: 400 }
    )
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const eventStream =
          referenceUrls.length > 0
            ? editImageStream({
                prompt,
                referenceImageUrls: referenceUrls,
                model: model as "gpt-image-1.5" | "gpt-image-1" | "gpt-image-1-mini" | undefined,
                size: size as "1024x1024" | "1024x1536" | "1536x1024" | undefined,
                quality: quality as "low" | "high" | undefined,
              })
            : generateImageStream({
                prompt,
                model: model as "gpt-image-1.5" | "gpt-image-1" | "gpt-image-1-mini" | undefined,
                size: size as "1024x1024" | "1024x1536" | "1536x1024" | undefined,
                quality: quality as "low" | "high" | undefined,
              })

        let finalB64: string | null = null

        for await (const event of eventStream) {
          if (event.type.endsWith(".partial_image")) {
            controller.enqueue(
              encoder.encode(
                sseEvent("partial_image", {
                  type: event.type,
                  b64_json: event.b64_json,
                  partial_image_index: event.partial_image_index,
                })
              )
            )
          } else if (event.type.endsWith(".completed")) {
            finalB64 = event.b64_json
            controller.enqueue(
              encoder.encode(
                sseEvent("completed", {
                  type: event.type,
                  b64_json: event.b64_json,
                })
              )
            )
          }
        }

        if (!finalB64) {
          controller.enqueue(
            encoder.encode(sseEvent("error", { error: "No image data received" }))
          )
          controller.close()
          return
        }

        const buffer = Buffer.from(finalB64, "base64")
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

        const publicUrl = getPublicUrl(
          adminSupabase,
          BUCKETS.aiGenerations as BucketId,
          path
        )

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
          linked_entity_type:
            shopifyProductId != null ? "shopify_product" : fragranceId ? "fragrance" : undefined,
          linked_entity_id:
            shopifyProductId != null ? String(shopifyProductId) : fragranceId,
          category:
            shopifyProductId != null ? "product-edit" : "fragrance-scene",
          source_model: sourceModel,
          generation_prompt: prompt,
          shopify_product_id: shopifyProductId,
          shopify_image_id: shopifyImageId,
        })

        const thumbnailUrl = getThumbnailUrl(
          adminSupabase,
          BUCKETS.aiGenerations as BucketId,
          path
        )
        const mediumUrl = getMediumUrl(
          adminSupabase,
          BUCKETS.aiGenerations as BucketId,
          path
        )

        const assetWithUrls = {
          ...asset,
          thumbnail_url: thumbnailUrl,
          medium_url: mediumUrl,
        }

        controller.enqueue(
          encoder.encode(
            sseEvent("asset_ready", {
              asset: assetWithUrls,
              publicUrl,
            })
          )
        )
      } catch (err) {
        console.error("Image generation stream error:", err)
        const message = err instanceof Error ? err.message : "Generation failed"
        controller.enqueue(
          encoder.encode(sseEvent("error", { error: message }))
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
