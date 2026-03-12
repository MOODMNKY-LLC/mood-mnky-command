import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ugcSubmitSchema } from "@/lib/ugc/schemas"
import { BUCKETS } from "@/lib/supabase/storage"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = ugcSubmitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { collectionId, type, caption, mediaPath, mediaHash } = parsed.data

  if (!mediaPath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Forbidden: path must be under your folder" }, { status: 403 })
  }

  const { data, error } = await supabase
    .from("ugc_submissions")
    .insert({
      profile_id: user.id,
      collection_id: collectionId ?? null,
      type,
      caption: caption ?? null,
      media_path: mediaPath,
      media_hash: mediaHash,
      status: "pending",
    })
    .select("id, status, created_at")
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Duplicate media (hash already submitted)" }, { status: 409 })
    }
    return NextResponse.json(
      { error: "Failed to submit UGC", details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, submission: data })
}
