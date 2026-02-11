import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSignedUrl } from "@/lib/supabase/storage"
import type { BucketId } from "@/lib/supabase/storage"

/**
 * Secure proxy for private bucket files.
 * GET /api/media/[id]/file - returns a signed URL or redirects to it.
 * Use for private-documents and other non-public buckets.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { data: asset, error } = await supabase
      .from("media_assets")
      .select("id, bucket_id, storage_path, user_id")
      .eq("id", id)
      .single()

    if (error || !asset) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (asset.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const bucket = asset.bucket_id as BucketId
    const path = asset.storage_path

    const signedUrl = await getSignedUrl(supabase, bucket, path, 3600)
    if (!signedUrl) {
      return NextResponse.json({ error: "Failed to generate access URL" }, { status: 500 })
    }

    return NextResponse.redirect(signedUrl, { status: 302 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to get file" },
      { status: 500 },
    )
  }
}
