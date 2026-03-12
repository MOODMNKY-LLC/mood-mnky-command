import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient, getSupabaseConfigMissing } from "@/lib/supabase/admin"
import { generateText, Output } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const descriptionSchema = z.object({
  description: z
    .string()
    .describe("1-2 sentence evocative description for gallery display"),
})

/**
 * POST: Regenerate AI description for a main_media_gallery entry. Admin only.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin" || profile?.is_admin === true
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (getSupabaseConfigMissing()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    )
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 503 }
    )
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 })
  }

  const { data: row, error: rowError } = await admin
    .from("main_media_gallery")
    .select("id, media_asset_id")
    .eq("id", id)
    .single()

  if (rowError || !row) {
    return NextResponse.json({ error: "Gallery entry not found" }, { status: 404 })
  }

  const { data: asset, error: assetError } = await admin
    .from("media_assets")
    .select("file_name, tags")
    .eq("id", row.media_asset_id)
    .single()

  if (assetError || !asset) {
    return NextResponse.json({ error: "Media asset not found" }, { status: 404 })
  }

  const fileLabel = asset.file_name ?? "artwork"
  const tagsLabel = Array.isArray(asset.tags)
    ? (asset.tags as string[]).join(", ")
    : ""

  const prompt = `Generate a short, evocative description for an art gallery item.
File name: ${fileLabel}
${tagsLabel ? `Tags: ${tagsLabel}` : ""}
Return 1-2 sentences suitable for display on a main site media gallery. Be concise and evocative.`

  try {
    const { output } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      output: Output.object({
        schema: descriptionSchema,
      }),
    })

    const description = (output.description ?? "").trim()
    const { error: updateError } = await admin
      .from("main_media_gallery")
      .update({ ai_description: description, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (updateError) {
      console.error("Main media gallery update error:", updateError)
      return NextResponse.json(
        { error: "Failed to save description" },
        { status: 500 }
      )
    }

    return NextResponse.json({ ai_description: description })
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
