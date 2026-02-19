import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { downloadEventSchema } from "@/lib/mag/schemas"
import { createAdminClient } from "@/lib/supabase/admin"
import { inngest } from "@/lib/inngest/client"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rateLimit = await checkRateLimit(`mag:download:${user.id}`)
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: rateLimit.reset },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.reset - Date.now()) / 1000)) } }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = downloadEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { issueId, downloadType } = parsed.data

  const admin = createAdminClient()
  const { error: insertError } = await admin.from("mnky_download_events").upsert(
    {
      profile_id: user.id,
      issue_id: issueId,
      download_type: downloadType,
    },
    { onConflict: "profile_id,issue_id,download_type" }
  )

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to record download", details: insertError.message },
      { status: 500 }
    )
  }

  await inngest.send({
    name: "mag/download.recorded",
    data: { profileId: user.id, issueId, downloadType },
  })

  // TODO: generate signed URL for actual asset (PDF, wallpaper pack, scent cards) from storage
  // For now return ok; client can use a public or pre-signed URL from another source
  return NextResponse.json({
    ok: true,
    message: "Download recorded; use issue assets URL for file.",
  })
}
