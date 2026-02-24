import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { BUCKETS, deleteFile } from "@/lib/supabase/storage"
import { requireAppAssetsAdmin } from "../../require-admin"

/** DELETE /api/app-assets/slots/[slotKey] – clear slot (remove file and media_asset_id). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slotKey: string }> }
) {
  const auth = await requireAppAssetsAdmin(_request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { slotKey } = await params
  const decodedSlotKey = decodeURIComponent(slotKey)
  if (!decodedSlotKey) {
    return NextResponse.json({ error: "Missing slotKey" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: slot, error: slotError } = await supabase
    .from("app_asset_slots")
    .select("id, media_asset_id")
    .eq("slot_key", decodedSlotKey)
    .single()

  if (slotError || !slot) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 })
  }

  const mediaAssetId = slot.media_asset_id as string | null
  if (mediaAssetId) {
    const { data: asset } = await supabase
      .from("media_assets")
      .select("id, bucket_id, storage_path")
      .eq("id", mediaAssetId)
      .single()
    if (asset?.storage_path) {
      try {
        await deleteFile(supabase, BUCKETS.serviceCards, asset.storage_path)
      } catch (e) {
        console.warn("[app-assets delete file]", e)
      }
      try {
        await supabase.from("media_assets").delete().eq("id", mediaAssetId)
      } catch (e) {
        console.warn("[app-assets delete media_asset]", e)
      }
    }
  }

  const { error: updateError } = await supabase
    .from("app_asset_slots")
    .update({
      media_asset_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", slot.id)

  if (updateError) {
    console.error("[app-assets slot clear]", updateError)
    return NextResponse.json(
      { error: "Failed to clear slot" },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
