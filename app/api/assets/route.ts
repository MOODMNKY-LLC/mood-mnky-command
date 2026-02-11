import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getMediaAssets,
  getThumbnailUrl,
  getMediumUrl,
  type BucketId,
  type MediaAsset,
} from "@/lib/supabase/storage"

export type AssetSource = "media" | "fragrance" | "static"

export interface RegistryAsset {
  id: string
  source: AssetSource
  url: string
  thumbnailUrl?: string
  mediumUrl?: string
  name?: string
  mimeType?: string
  linkedEntityType?: string
  linkedEntityId?: string
}

function enrichMediaAsset(
  supabase: Awaited<ReturnType<typeof createClient>>,
  asset: MediaAsset
): RegistryAsset {
  const thumbnailUrl =
    asset.mime_type?.startsWith("image/") && asset.bucket_id && asset.storage_path
      ? getThumbnailUrl(supabase, asset.bucket_id as BucketId, asset.storage_path)
      : undefined
  const mediumUrl =
    asset.mime_type?.startsWith("image/") && asset.bucket_id && asset.storage_path
      ? getMediumUrl(supabase, asset.bucket_id as BucketId, asset.storage_path)
      : undefined

  return {
    id: asset.id,
    source: "media",
    url: asset.public_url ?? "",
    thumbnailUrl,
    mediumUrl,
    name: asset.file_name,
    mimeType: asset.mime_type ?? undefined,
    linkedEntityType: asset.linked_entity_type ?? undefined,
    linkedEntityId: asset.linked_entity_id ?? undefined,
  }
}

/**
 * Asset registry API - unified catalog of digital assets.
 * GET /api/assets?source=media|fragrance|all&limit=50
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const source = searchParams.get("source") || "media"
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100)

  try {
    const assets: RegistryAsset[] = []

    if (source === "media" || source === "all") {
      const { assets: mediaAssets } = await getMediaAssets(supabase, {
        limit,
        offset: 0,
      })
      assets.push(...mediaAssets.map((a) => enrichMediaAsset(supabase, a)))
    }

    if (source === "fragrance" || source === "all") {
      const { data: fragranceRows } = await supabase
        .from("fragrance_oils")
        .select("id, name, image_url")
        .not("image_url", "is", null)
        .limit(limit)

      for (const row of fragranceRows ?? []) {
        if (row.image_url) {
          assets.push({
            id: `fragrance-${row.id}`,
            source: "fragrance",
            url: row.image_url,
            name: row.name,
            linkedEntityType: "fragrance",
            linkedEntityId: row.id,
          })
        }
      }
    }

    return NextResponse.json({
      assets,
      total: assets.length,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch assets" },
      { status: 500 },
    )
  }
}
