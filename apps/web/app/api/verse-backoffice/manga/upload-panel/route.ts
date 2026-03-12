import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireInternalApiKey } from "@/lib/api/internal-auth"
import { BUCKETS, getPublicUrl } from "@/lib/supabase/storage"
import { pushMangaPanelAssetUrlToNotion } from "@/lib/notion"

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

async function requireMangaAdmin(request: NextRequest): Promise<boolean> {
  if (requireInternalApiKey(request)) return true
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.rpc("is_admin")
  return data === true
}

export async function POST(request: NextRequest) {
  if (!(await requireMangaAdmin(request))) {
    return NextResponse.json(
      { error: "Unauthorized. Use MOODMNKY_API_KEY or admin session." },
      { status: 401 }
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const panelId = formData.get("panelId")?.toString()
  const file = formData.get("file") instanceof File ? (formData.get("file") as File) : null

  if (!panelId || !file || file.size === 0) {
    return NextResponse.json(
      { error: "Missing panelId or file" },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 10 MB)" },
      { status: 400 }
    )
  }

  const type = file.type?.toLowerCase()
  const ext = type === "image/jpeg" ? "jpg" : type === "image/png" ? "png" : type === "image/webp" ? "webp" : type === "image/gif" ? "gif" : "webp"
  if (!ACCEPTED_TYPES.includes(type || "")) {
    return NextResponse.json(
      { error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const { data: panel, error: panelError } = await supabase
    .from("mnky_panels")
    .select("id, chapter_id, notion_id")
    .eq("id", panelId)
    .single()

  if (panelError || !panel) {
    return NextResponse.json({ error: "Panel not found" }, { status: 404 })
  }

  const path = `panels/${panel.id}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKETS.mangaAssets)
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    console.error("Manga panel upload error:", uploadError)
    return NextResponse.json(
      { error: "Upload failed: " + uploadError.message },
      { status: 500 }
    )
  }

  const publicUrl = getPublicUrl(supabase, BUCKETS.mangaAssets, path)

  const { error: updateError } = await supabase
    .from("mnky_panels")
    .update({ asset_url: publicUrl })
    .eq("id", panel.id)

  if (updateError) {
    console.error("Manga panel DB update error:", updateError)
    return NextResponse.json(
      { error: "Failed to update panel" },
      { status: 500 }
    )
  }

  if (panel.notion_id) {
    try {
      await pushMangaPanelAssetUrlToNotion(panel.notion_id, publicUrl)
    } catch (e) {
      console.warn("Notion push failed (panel asset URL):", e)
    }
  }

  return NextResponse.json({ url: publicUrl })
}
