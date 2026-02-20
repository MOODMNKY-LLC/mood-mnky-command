import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  uploadFile,
  saveMediaAsset,
  getPublicUrl,
  BUCKETS,
  type BucketId,
} from "@/lib/supabase/storage"
import { getProduct } from "@/lib/shopify"

interface ImportImageBody {
  imageIndex?: number
  imageId?: number
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const productId = parseInt(id, 10)
  if (isNaN(productId)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
  }

  let body: ImportImageBody
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const { imageIndex, imageId } = body

  try {
    const product = await getProduct(productId)
    const images = product.images ?? []
    if (images.length === 0) {
      return NextResponse.json({ error: "Product has no images" }, { status: 400 })
    }

    let image: { id: number; src: string }
    if (imageId != null) {
      const found = images.find((img) => img.id === imageId)
      if (!found) {
        return NextResponse.json({ error: "Image not found" }, { status: 400 })
      }
      image = found
    } else {
      const idx = imageIndex ?? 0
      if (idx < 0 || idx >= images.length) {
        return NextResponse.json({ error: "Image index out of range" }, { status: 400 })
      }
      image = images[idx]
    }

    const res = await fetch(image.src)
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`)

    const contentType = res.headers.get("content-type") || "image/png"
    const blob = await res.blob()
    const timestamp = Date.now()
    const ext = contentType.includes("webp") ? "webp" : contentType.includes("jpeg") ? "jpg" : "png"
    const fileName = `shopify_${productId}_${image.id}_${timestamp}.${ext}`

    const adminSupabase = createAdminClient()
    const { path } = await uploadFile(
      adminSupabase,
      BUCKETS.productImages as BucketId,
      user.id,
      fileName,
      blob,
      { contentType, upsert: true }
    )

    const publicUrl = getPublicUrl(adminSupabase, BUCKETS.productImages as BucketId, path)

    const asset = await saveMediaAsset(adminSupabase, {
      user_id: user.id,
      bucket_id: BUCKETS.productImages as BucketId,
      storage_path: path,
      file_name: fileName,
      mime_type: contentType,
      file_size: blob.size,
      tags: ["shopify-import"],
      public_url: publicUrl,
      linked_entity_type: "shopify_product",
      linked_entity_id: String(productId),
      shopify_product_id: productId,
      shopify_image_id: image.id,
    })

    return NextResponse.json({
      assetId: asset.id,
      publicUrl,
      productId,
      imageId: image.id,
    })
  } catch (err) {
    console.error("Import product image error:", err)
    const message = err instanceof Error ? err.message : "Import failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
