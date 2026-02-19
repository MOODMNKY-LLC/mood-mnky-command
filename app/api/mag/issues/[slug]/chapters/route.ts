import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: issue } = await supabase
    .from("mnky_issues")
    .select("id")
    .eq("slug", slug)
    .single()

  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 })
  }

  const { data: chapters, error } = await supabase
    .from("mnky_chapters")
    .select("id, fragrance_name, shopify_product_gid, setting, chapter_order")
    .eq("issue_id", issue.id)
    .order("chapter_order", { ascending: true })

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch chapters", details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ chapters: chapters ?? [] })
}
