import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getMediaAssets } from "@/lib/supabase/storage"
import type { BucketId } from "@/lib/supabase/storage"

/**
 * POST /api/media/check-duplicates
 * Body: { bucket: BucketId, fileNames: string[] }
 * Returns: { existing: { id: string; file_name: string }[] }
 * Auth: Supabase session required. Only returns user's own assets.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { bucket?: string; fileNames?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    )
  }

  const bucket = body.bucket as BucketId | undefined
  const fileNames = body.fileNames as string[] | undefined

  if (!bucket || !Array.isArray(fileNames) || fileNames.length === 0) {
    return NextResponse.json(
      { error: "bucket and fileNames (array) required" },
      { status: 400 }
    )
  }

  const uniqueNames = [...new Set(fileNames)].filter(Boolean)
  if (uniqueNames.length === 0) {
    return NextResponse.json({ existing: [] })
  }

  try {
    const { assets } = await getMediaAssets(supabase, {
      bucket_id: bucket,
      file_names: uniqueNames,
      limit: uniqueNames.length,
    })
    return NextResponse.json({
      existing: assets.map((a) => ({ id: a.id, file_name: a.file_name })),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Check failed" },
      { status: 500 }
    )
  }
}
