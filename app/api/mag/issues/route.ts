import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const collectionSlug = searchParams.get("collection")
  const status = searchParams.get("status")

  let query = supabase
    .from("mnky_issues")
    .select("id, collection_id, issue_number, title, slug, status, cover_asset_url, published_at, created_at")
    .order("issue_number", { ascending: true })

  if (status) {
    query = query.eq("status", status)
  }

  if (collectionSlug) {
    const { data: col } = await supabase
      .from("mnky_collections")
      .select("id")
      .eq("slug", collectionSlug)
      .single()
    if (col?.id) query = query.eq("collection_id", col.id)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch issues", details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ issues: data ?? [] })
}
