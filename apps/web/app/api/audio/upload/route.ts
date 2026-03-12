import { NextResponse } from "next/server"
import { parseBuffer } from "music-metadata"
import { createClient } from "@/lib/supabase/server"
import {
  BUCKETS,
  getPublicUrl,
  uploadFile,
  saveMediaAsset,
  type BucketId,
} from "@/lib/supabase/storage"

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB
const ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/aac",
  "audio/flac",
  "audio/webm",
  "audio/mp4",
  "audio/x-m4a",
  "video/mp4",
]

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "audio"
}

function getCoverMime(picture: { format: string }): string {
  const fmt = (picture.format || "").toLowerCase()
  if (fmt.includes("png")) return "image/png"
  if (fmt.includes("webp")) return "image/webp"
  return "image/jpeg"
}

/**
 * Upload one or more audio files to mnky-verse-tracks.
 * Extracts metadata (title, artist, album, cover art) and saves to media_assets.
 * Auth: Supabase session required.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const bucket = BUCKETS.mnkyVerseTracks as BucketId
  const singleFile = formData.get("file") as File | null
  const multipleFiles = formData.getAll("files") as File[]
  const files = singleFile ? [singleFile] : multipleFiles

  if (!files?.length) {
    return NextResponse.json(
      { error: "At least one file required (field: file or files)" },
      { status: 400 }
    )
  }

  const linkedEntityType = (formData.get("linked_entity_type") as string) || undefined
  const linkedEntityId = (formData.get("linked_entity_id") as string) || undefined

  const assets: Awaited<ReturnType<typeof saveMediaAsset>>[] = []

  for (const file of files) {
    if (!(file instanceof File)) continue
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File ${file.name} exceeds 50 MB limit` },
        { status: 400 }
      )
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed: ${file.type}` },
        { status: 400 }
      )
    }

    const safeName = sanitizeFilename(file.name)
    const uniqueId = crypto.randomUUID()
    const storageFileName = `${uniqueId}-${safeName}`

    try {
      const { path } = await uploadFile(
        supabase,
        bucket,
        user.id,
        storageFileName,
        file,
        { contentType: file.type }
      )
      const publicUrl = getPublicUrl(supabase, bucket, path)

      let audioTitle: string | undefined
      let audioArtist: string | undefined
      let audioAlbum: string | undefined
      let coverArtPath: string | undefined
      let coverArtUrl: string | undefined

      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const metadata = await parseBuffer(buffer, { mimeType: file.type })
        const common = metadata.common

        audioTitle = common.title ?? undefined
        audioArtist = common.artist ?? undefined
        audioAlbum = common.album ?? undefined

        const picture = common.picture?.[0]
        if (picture?.data) {
          const mime = getCoverMime(picture)
          const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg"
          const coverBlob = new Blob([picture.data], { type: mime })

          const { path: coverPath } = await uploadFile(
            supabase,
            bucket,
            user.id,
            `covers/${uniqueId}-cover.${ext}`,
            coverBlob,
            { contentType: mime }
          )
          coverArtPath = coverPath
          coverArtUrl = getPublicUrl(supabase, bucket, coverPath)
        }
      } catch (metaErr) {
        console.warn("Audio metadata extraction failed:", metaErr)
      }

      const asset = await saveMediaAsset(supabase, {
        user_id: user.id,
        bucket_id: bucket,
        storage_path: path,
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        public_url: publicUrl,
        category: "verse-track",
        linked_entity_type: linkedEntityType,
        linked_entity_id: linkedEntityId,
        audio_codec: file.type.split("/")[1]?.replace("x-", "") || undefined,
        audio_title: audioTitle,
        audio_artist: audioArtist,
        audio_album: audioAlbum,
        cover_art_path: coverArtPath,
        cover_art_url: coverArtUrl,
      })
      assets.push(asset)
    } catch (err) {
      console.error("Audio upload error:", err)
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Upload failed" },
        { status: 500 }
      )
    }
  }

  return NextResponse.json(
    assets.length === 1 ? { asset: assets[0] } : { assets }
  )
}
