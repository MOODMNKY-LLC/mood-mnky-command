import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { readEventSchema } from "@/lib/mag/schemas"
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

  const rateLimit = await checkRateLimit(`mag:read:${user.id}`)
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

  const parsed = readEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { issueId, chapterId, sessionId, percentRead, activeSeconds, completed } = parsed.data

  const { error } = await supabase.from("mnky_read_events").insert({
    profile_id: user.id,
    issue_id: issueId,
    chapter_id: chapterId ?? null,
    session_id: sessionId,
    percent_read: percentRead,
    active_seconds: activeSeconds,
    completed,
  })

  if (error) {
    return NextResponse.json(
      { error: "Failed to record read event", details: error.message },
      { status: 500 }
    )
  }

  // Award XP via Inngest when read completion criteria met (PRD: percent_read >= 80, active_seconds >= 90)
  if (completed && percentRead >= 80 && activeSeconds >= 90 && issueId) {
    await inngest.send({
      name: "mag/read.completed",
      data: { profileId: user.id, issueId },
    })
  }

  return NextResponse.json({ ok: true })
}
