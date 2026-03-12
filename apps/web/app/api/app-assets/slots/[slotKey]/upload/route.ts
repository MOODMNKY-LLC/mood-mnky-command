import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  BUCKETS,
  getPublicUrl,
  saveMediaAsset,
  deleteFile,
} from "@/lib/supabase/storage"
import { pushAppAssetSlotUrlToNotion } from "@/lib/notion"
import { requireAppAssetsAdmin } from "../../../require-admin"

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB (matches bucket)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slotKey: string }> }
) {
  const auth = await requireAppAssetsAdmin(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { slotKey } = await params
  const decodedSlotKey = decodeURIComponent(slotKey)
  if (!decodedSlotKey) {
    return NextResponse.json({ error: "Missing slotKey" }, { status: 400 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file") instanceof File ? (formData.get("file") as File) : null
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Missing or empty file" }, { status: 400 })
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 10 MB)" },
      { status: 400 }
    )
  }

  const type = (file.type || "").toLowerCase()
  const ext =
    type === "image/jpeg" || type === "image/jpg"
      ? "jpg"
      : type === "image/png"
        ? "png"
        : type === "image/webp"
          ? "webp"
          : type === "image/gif"
            ? "gif"
            : type === "image/svg+xml"
              ? "svg"
              : "webp"
  if (!ACCEPTED_TYPES.includes(type) && !file.name?.match(/\.(svg|png|jpe?g|webp|gif)$/i)) {
    return NextResponse.json(
      { error: "Invalid file type. Use JPEG, PNG, WebP, GIF, or SVG." },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { data: slot, error: slotError } = await supabase
    .from("app_asset_slots")
    .select("id, media_asset_id, notion_page_id")
    .eq("slot_key", decodedSlotKey)
    .single()

  if (slotError || !slot) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 })
  }

  const storagePath = `bundles/${decodedSlotKey}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKETS.serviceCards)
    .upload(storagePath, file, {
      contentType: file.type || `image/${ext}`,
      upsert: true,
    })

  if (uploadError) {
    console.error("[app-assets upload]", uploadError)
    return NextResponse.json(
      { error: "Upload failed: " + uploadError.message },
      { status: 500 }
    )
  }

  const publicUrl = getPublicUrl(supabase, BUCKETS.serviceCards, storagePath)

  let newAssetId: string

  try {
    const asset = await saveMediaAsset(supabase, {
      user_id: auth.userId,
      bucket_id: BUCKETS.serviceCards,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type || undefined,
      file_size: file.size,
      linked_entity_type: "app_slot",
      linked_entity_id: decodedSlotKey,
      public_url: publicUrl,
      category: "service-card",
      tags: ["app-asset", decodedSlotKey],
    })
    newAssetId = asset.id
  } catch (e) {
    console.error("[app-assets saveMediaAsset]", e)
    return NextResponse.json(
      { error: "Failed to record asset" },
      { status: 500 }
    )
  }

  const oldMediaAssetId = slot.media_asset_id as string | null
  if (oldMediaAssetId && oldMediaAssetId !== newAssetId) {
    const { data: oldAsset } = await supabase
      .from("media_assets")
      .select("id, bucket_id, storage_path")
      .eq("id", oldMediaAssetId)
      .single()
    if (oldAsset?.storage_path) {
      try {
        await deleteFile(supabase, BUCKETS.serviceCards, oldAsset.storage_path)
      } catch {
        // ignore
      }
      try {
        await supabase.from("media_assets").delete().eq("id", oldMediaAssetId)
      } catch {
        // ignore
      }
    }
  }

  const { error: updateError } = await supabase
    .from("app_asset_slots")
    .update({
      media_asset_id: newAssetId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", slot.id)

  if (updateError) {
    console.error("[app-assets slot update]", updateError)
    return NextResponse.json(
      { error: "Failed to update slot" },
      { status: 500 }
    )
  }

  if (slot.notion_page_id) {
    try {
      await pushAppAssetSlotUrlToNotion(slot.notion_page_id, publicUrl)
    } catch (e) {
      console.warn("[app-assets Notion push]", e)
    }
  }

  return NextResponse.json({
    url: publicUrl,
    media_asset_id: newAssetId,
  })
}
