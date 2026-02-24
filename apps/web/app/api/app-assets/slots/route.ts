import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAppAssetsAdmin } from "../require-admin"

export interface AppAssetSlotRow {
  id: string
  slot_key: string
  label: string
  category: string
  route_hint: string | null
  media_asset_id: string | null
  notion_page_id: string | null
  current_url: string | null
  thumbnail_url: string | null
}

/** GET /api/app-assets/slots – list slots with resolved URLs (admin or authenticated for back office). */
export async function GET(request: Request) {
  const auth = await requireAppAssetsAdmin(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category") || undefined

  const admin = createAdminClient()

  let slotsQuery = admin
    .from("app_asset_slots")
    .select(`
      id,
      slot_key,
      label,
      category,
      route_hint,
      media_asset_id,
      notion_page_id,
      media_assets (
        id,
        bucket_id,
        storage_path,
        public_url
      )
    `)
    .order("category")
    .order("slot_key")

  if (category) slotsQuery = slotsQuery.eq("category", category)

  const { data: rows, error } = await slotsQuery

  if (error) {
    console.error("[app-assets/slots GET]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const slots: AppAssetSlotRow[] = (rows ?? []).map((row: Record<string, unknown>) => {
    const ma = (Array.isArray(row.media_assets) ? row.media_assets[0] : row.media_assets) as
      | { bucket_id?: string; storage_path?: string; public_url?: string }
      | null
      | undefined
    let current_url: string | null = null
    let thumbnail_url: string | null = null
    if (ma?.public_url) {
      current_url = ma.public_url
      thumbnail_url = ma.public_url
    }
    return {
      id: row.id,
      slot_key: row.slot_key,
      label: row.label,
      category: row.category,
      route_hint: row.route_hint,
      media_asset_id: row.media_asset_id,
      notion_page_id: row.notion_page_id,
      current_url,
      thumbnail_url,
    }
  })

  return NextResponse.json({ slots })
}
