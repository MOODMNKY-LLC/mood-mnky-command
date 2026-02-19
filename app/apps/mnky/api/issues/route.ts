import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const collection = searchParams.get("collection")
  const status = searchParams.get("status") ?? "published"

  const supabase = await createClient()
  let query = supabase
    .from("mnky_issues")
    .select("id, slug, title, issue_number, status, cover_asset_url, published_at")
    .eq("status", status)
    .order("issue_number", { ascending: false })

  if (collection) {
    const { data: col } = await supabase
      .from("mnky_collections")
      .select("id")
      .eq("slug", collection)
      .single()
    if (col?.id) query = query.eq("collection_id", col.id)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ issues: data ?? [] })
}
