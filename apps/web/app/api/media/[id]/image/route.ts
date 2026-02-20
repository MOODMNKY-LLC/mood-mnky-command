import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getPublicUrl,
  getThumbnailUrl,
  getMediumUrl,
  type BucketId,
} from "@/lib/supabase/storage"

type Preset = "thumbnail" | "medium" | "full"

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

  const { searchParams } = new URL(request.url)
  const preset = (searchParams.get("preset") || "full") as Preset

  try {
    const { data: asset, error } = await supabase
      .from("media_assets")
      .select("id, bucket_id, storage_path, mime_type")
      .eq("id", id)
      .single()

    if (error || !asset) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (!asset.mime_type?.startsWith("image/")) {
      return NextResponse.json({ error: "Not an image" }, { status: 400 })
    }

    const bucket = asset.bucket_id as BucketId
    const path = asset.storage_path

    let url: string
    if (preset === "thumbnail") {
      url = getThumbnailUrl(supabase, bucket, path)
    } else if (preset === "medium") {
      url = getMediumUrl(supabase, bucket, path)
    } else {
      url = getPublicUrl(supabase, bucket, path)
    }

    return NextResponse.redirect(url, { status: 302 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to get image" },
      { status: 500 },
    )
  }
}
