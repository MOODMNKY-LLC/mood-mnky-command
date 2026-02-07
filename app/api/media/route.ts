import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getMediaAssets, type BucketId } from "@/lib/supabase/storage"

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const bucket = searchParams.get("bucket") as BucketId | null
  const search = searchParams.get("search") || undefined
  const tagsParam = searchParams.get("tags")
  const tags = tagsParam ? tagsParam.split(",") : undefined
  const limit = Number(searchParams.get("limit")) || 50
  const offset = Number(searchParams.get("offset")) || 0

  try {
    const { assets, count } = await getMediaAssets(supabase, {
      bucket_id: bucket ?? undefined,
      search,
      tags,
      limit,
      offset,
    })
    return NextResponse.json({ assets, count })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch" },
      { status: 500 },
    )
  }
}
