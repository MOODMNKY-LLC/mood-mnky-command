import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("mnky_issues")
    .select(`
      id,
      collection_id,
      issue_number,
      title,
      slug,
      status,
      arc_summary,
      cover_asset_url,
      published_at,
      created_at,
      mnky_collections ( id, name, slug )
    `)
    .eq("slug", slug)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Issue not found" },
      { status: error?.code === "PGRST116" ? 404 : 500 }
    )
  }

  return NextResponse.json(data)
}
