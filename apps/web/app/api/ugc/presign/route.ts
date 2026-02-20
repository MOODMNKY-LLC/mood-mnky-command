import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ugcPresignSchema } from "@/lib/ugc/schemas"
import { BUCKETS } from "@/lib/supabase/storage"
import { nanoid } from "nanoid"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rateLimit = await checkRateLimit(`ugc:presign:${user.id}`)
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

  const parsed = ugcPresignSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { mediaType, filename } = parsed.data
  const ext = mediaType.startsWith("image/")
    ? mediaType.replace("image/", "")
    : mediaType.startsWith("video/")
      ? "mp4"
      : "bin"
  const path = `${user.id}/${nanoid()}.${ext}`

  return NextResponse.json({
    path,
    bucket: BUCKETS.ugcSubmissions,
    mediaType,
    uploadHint: "Upload to Supabase Storage using the client; path must match.",
  })
}
