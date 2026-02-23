import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  updateMediaAsset,
  deleteMediaAsset,
  getThumbnailUrl,
  getMediumUrl,
  getPublicUrl,
  type BucketId,
} from "@/lib/supabase/storage"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: asset, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !asset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (asset.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

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
      // Fallback to public_url
    }
  }
  // Resolve cover art URL for audio/video when path exists but URL is missing
  const isAudioOrVideo =
    asset.mime_type?.startsWith("audio/") || asset.mime_type?.startsWith("video/")
  if (
    isAudioOrVideo &&
    asset.cover_art_path &&
    !asset.cover_art_url &&
    asset.bucket_id
  ) {
    try {
      enriched.cover_art_url = getPublicUrl(
        supabase,
        asset.bucket_id as BucketId,
        asset.cover_art_path
      )
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ asset: enriched })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const asset = await updateMediaAsset(supabase, id, {
      tags: body.tags,
      alt_text: body.alt_text,
      description: body.description,
      linked_entity_type: body.linked_entity_type,
      linked_entity_id: body.linked_entity_id,
      category: body.category,
      source_model: body.source_model,
      generation_prompt: body.generation_prompt,
    })
    return NextResponse.json({ asset })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { data: asset } = await supabase
      .from("media_assets")
      .select("id, user_id, bucket_id, storage_path, cover_art_path")
      .eq("id", id)
      .single()

    if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (asset.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    await deleteMediaAsset(supabase, {
      id: asset.id,
      bucket_id: asset.bucket_id as BucketId,
      storage_path: asset.storage_path,
      cover_art_path: asset.cover_art_path,
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 },
    )
  }
}
