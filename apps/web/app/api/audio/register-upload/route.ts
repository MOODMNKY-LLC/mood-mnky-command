import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { BUCKETS, getPublicUrl, saveMediaAsset, type BucketId } from "@/lib/supabase/storage"

type RegisterUploadBody = {
  bucket_id: string
  storage_path: string
  file_name: string
  mime_type?: string | null
  file_size?: number | null
  public_url?: string | null
  category?: string | null
  audio_title?: string | null
  audio_artist?: string | null
  audio_album?: string | null
  cover_art_path?: string | null
  cover_art_url?: string | null
}

/**
 * POST: Register a previously-uploaded storage object into `media_assets`.
 *
 * This endpoint exists so large audio files can be uploaded directly from the browser
 * to Supabase Storage (bypassing Vercel request body limits), while still storing
 * metadata in `media_assets` with RLS enforced.
 *
 * Auth: Supabase session required.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: RegisterUploadBody
  try {
    body = (await request.json()) as RegisterUploadBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const bucket = body.bucket_id as BucketId | undefined
  if (!bucket || bucket !== (BUCKETS.mnkyVerseTracks as BucketId)) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 })
  }
  if (!body.storage_path || !body.file_name) {
    return NextResponse.json({ error: "storage_path and file_name required" }, { status: 400 })
  }

  // Prevent cross-user registration (storage RLS should prevent cross-user writes, but this adds defense-in-depth).
  if (!body.storage_path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const publicUrl =
    body.public_url ??
    getPublicUrl(supabase, bucket, body.storage_path)

  try {
    const asset = await saveMediaAsset(supabase, {
      user_id: user.id,
      bucket_id: bucket,
      storage_path: body.storage_path,
      file_name: body.file_name,
      mime_type: body.mime_type ?? undefined,
      file_size: body.file_size ?? undefined,
      public_url: publicUrl,
      category: body.category ?? "verse-track",
      audio_title: body.audio_title ?? undefined,
      audio_artist: body.audio_artist ?? undefined,
      audio_album: body.audio_album ?? undefined,
      cover_art_path: body.cover_art_path ?? undefined,
      cover_art_url: body.cover_art_url ?? undefined,
    })
    return NextResponse.json({ asset })
  } catch (err) {
    console.error("Register upload error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to register upload" },
      { status: 500 }
    )
  }
}

