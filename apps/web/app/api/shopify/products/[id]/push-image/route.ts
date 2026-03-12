import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  createProductImage,
  deleteProductImage,
} from "@/lib/shopify"

interface PushImageBody {
  assetId: string
  replaceImageId?: number
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

  let body: PushImageBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { assetId, replaceImageId } = body
  if (!assetId || typeof assetId !== "string") {
    return NextResponse.json({ error: "assetId is required" }, { status: 400 })
  }

  try {
    const { data: asset, error: assetError } = await supabase
      .from("media_assets")
      .select("id, public_url, user_id")
      .eq("id", assetId)
      .single()

    if (assetError || !asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    if (asset.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const publicUrl = asset.public_url
    if (!publicUrl || typeof publicUrl !== "string") {
      return NextResponse.json({ error: "Asset has no public URL" }, { status: 400 })
    }

    const newImage = await createProductImage(productId, publicUrl)

    if (replaceImageId != null) {
      await deleteProductImage(productId, replaceImageId)
    }

    return NextResponse.json({
      success: true,
      newImageId: newImage.id,
      productId,
      productUrl: `https://${process.env.SHOPIFY_STORE_DOMAIN || ""}/admin/products/${productId}`,
    })
  } catch (err) {
    console.error("Push image to Shopify error:", err)
    const message = err instanceof Error ? err.message : "Push failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
