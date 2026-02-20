import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { quizSubmitSchema } from "@/lib/mag/schemas"
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

  const rateLimit = await checkRateLimit(`mag:quiz:${user.id}`)
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

  const parsed = quizSubmitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { issueId, score, passed } = parsed.data

  const { error } = await supabase.from("mnky_quiz_attempts").insert({
    profile_id: user.id,
    issue_id: issueId,
    score,
    passed,
  })

  if (error) {
    return NextResponse.json(
      { error: "Failed to record quiz attempt", details: error.message },
      { status: 500 }
    )
  }

  if (passed && issueId) {
    await inngest.send({
      name: "mag/quiz.passed",
      data: { profileId: user.id, issueId, score },
    })
  }

  return NextResponse.json({ ok: true, passed })
}
