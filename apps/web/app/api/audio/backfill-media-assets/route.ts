import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  BUCKETS,
  getPublicUrl,
  listFiles,
  saveMediaAsset,
  type BucketId,
} from "@/lib/supabase/storage"

const BUCKET = BUCKETS.mnkyVerseTracks as BucketId
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

/**
 * POST: Backfill media_assets from existing storage objects in mnky-verse-tracks.
 * One-time admin operation. Skips rows that already exist (upsert).
 *
 * Auth: Supabase session + admin (role/admin or is_admin).
 */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single()
  const isAdmin = profile?.role === "admin" || profile?.is_admin === true
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const created: string[] = []
  const skipped: string[] = []
  const errors: string[] = []

  try {
    // List root to get user folders (user IDs are UUIDs)
    const rootItems = (await listFiles(admin, BUCKET, "", { limit: 500 })) ?? []
    const userIdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const uniqueUserIds = [
      ...new Set(
        rootItems
          .map((item) => item.name)
          .filter(
            (name): name is string =>
              !!name && !name.includes("/") && userIdRegex.test(name)
          )
      ),
    ]

    for (const userId of uniqueUserIds) {
      // List user folder contents
      const userFiles = await listFiles(admin, BUCKET, userId, { limit: 500 })
      const coversByUniqueId = new Map<string, { path: string; ext: string }>()

      // Check for covers subfolder
      const coversFolder = (userFiles ?? []).find((item) => item.name === "covers")
      if (coversFolder) {
        const coverFiles = await listFiles(admin, BUCKET, `${userId}/covers`, { limit: 500 })
        for (const cf of coverFiles ?? []) {
          if (!cf.name) continue
          const match = cf.name.match(UUID_REGEX)
          if (match) {
            const uid = match[0]
            const ext = cf.name.endsWith(".png") ? "png" : cf.name.endsWith(".webp") ? "webp" : "jpg"
            coversByUniqueId.set(uid, {
              path: `${userId}/covers/${cf.name}`,
              ext,
            })
          }
        }
      }

      for (const file of userFiles ?? []) {
        if (!file.name || file.name === "covers") continue
        // Skip if it looks like a folder (no extension)
        if (!/\.(mp3|wav|flac|ogg|aac|m4a|webm|mp4)$/i.test(file.name)) continue

        const storagePath = `${userId}/${file.name}`
        const match = file.name.match(UUID_REGEX)
        const uniqueId = match ? match[0] : null
        const coverInfo = uniqueId ? coversByUniqueId.get(uniqueId) : null

        const publicUrl = getPublicUrl(admin, BUCKET, storagePath)
        const coverArtPath = coverInfo?.path ?? null
        const coverArtUrl = coverInfo
          ? getPublicUrl(admin, BUCKET, coverInfo.path)
          : null

        const mime = file.metadata?.mimetype as string | undefined
        const size = (file.metadata?.size as number) ?? null

        try {
          await saveMediaAsset(admin, {
            user_id: userId,
            bucket_id: BUCKET,
            storage_path: storagePath,
            file_name: file.name,
            mime_type: mime ?? "audio/mpeg",
            file_size: size ?? undefined,
            public_url: publicUrl,
            category: "verse-track",
            cover_art_path: coverArtPath ?? undefined,
            cover_art_url: coverArtUrl ?? undefined,
          })
          created.push(storagePath)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          if (msg.includes("duplicate") || msg.includes("unique") || msg.includes("conflict")) {
            skipped.push(storagePath)
          } else {
            errors.push(`${storagePath}: ${msg}`)
          }
        }
      }
    }

    return NextResponse.json({
      created: created.length,
      skipped: skipped.length,
      errors: errors.slice(0, 20),
      total: created.length + skipped.length + errors.length,
    })
  } catch (err) {
    console.error("Backfill error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Backfill failed" },
      { status: 500 }
    )
  }
}
