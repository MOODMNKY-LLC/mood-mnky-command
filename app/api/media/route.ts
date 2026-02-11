import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getMediaAssets,
  getThumbnailUrl,
  getMediumUrl,
  type BucketId,
  type MediaAsset,
} from "@/lib/supabase/storage"

function enrichAssetWithTransforms(
  supabase: Awaited<ReturnType<typeof createClient>>,
  asset: MediaAsset
): MediaAsset & { thumbnail_url?: string; medium_url?: string } {
  const enriched = { ...asset }
  if (
    asset.mime_type?.startsWith("image/") &&
    asset.bucket_id &&
    asset.storage_path
  ) {
    try {
      enriched.thumbnail_url = getThumbnailUrl(
        supabase,
        asset.bucket_id as BucketId,
        asset.storage_path
      )
      enriched.medium_url = getMediumUrl(
        supabase,
        asset.bucket_id as BucketId,
        asset.storage_path
      )
    } catch {
      // Fallback to public_url if transforms unavailable
    }
  }
  return enriched
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const bucket = searchParams.get("bucket") as BucketId | null
  const category = searchParams.get("category") || undefined
  const linkedEntityType = searchParams.get("linked_entity_type") || undefined
  const linkedEntityId = searchParams.get("linked_entity_id") || undefined
  const search = searchParams.get("search") || undefined
  const tagsParam = searchParams.get("tags")
  const tags = tagsParam ? tagsParam.split(",") : undefined
  const limit = Number(searchParams.get("limit")) || 50
  const offset = Number(searchParams.get("offset")) || 0

  try {
    const { assets, count } = await getMediaAssets(supabase, {
      bucket_id: bucket ?? undefined,
      category,
      linked_entity_type: linkedEntityType,
      linked_entity_id: linkedEntityId,
      search,
      tags,
      limit,
      offset,
    })
    const enrichedAssets = assets.map((a) => enrichAssetWithTransforms(supabase, a))
    return NextResponse.json({ assets: enrichedAssets, count })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch" },
      { status: 500 },
    )
  }
}
