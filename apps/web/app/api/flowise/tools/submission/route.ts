import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"

const bodySchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().optional(),
  chatId: z.string().optional(),
  funnelId: z.string().optional(),
})

/**
 * Accept Bearer MOODMNKY_API_KEY or FLOWISE_API_KEY (Flowise callbacks).
 */
function requireFlowiseToolAuth(request: Request): boolean {
  const auth = request.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return false
  const token = auth.slice(7).trim()
  const moodMnky = process.env.MOODMNKY_API_KEY
  const flowise = process.env.FLOWISE_API_KEY
  if (moodMnky && token === moodMnky) return true
  if (flowise && token === flowise) return true
  return false
}

/**
 * POST /api/flowise/tools/submission
 *
 * Get the user's latest funnel submission for Flowise getLatestFunnelSubmission tool.
 * Requires Bearer MOODMNKY_API_KEY or FLOWISE_API_KEY.
 * Body: { userId, sessionId?, chatId?, funnelId? }
 * Returns: { submission: { runId, funnelId, submittedAt, answers, mappedAnswers, questionMapping } | null }
 */
export async function POST(request: Request) {
  if (!requireFlowiseToolAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { userId, funnelId } = parsed.data
  const withinHours = 24
  const since = new Date()
  since.setHours(since.getHours() - withinHours)

  const admin = createAdminClient()

  let runQuery = admin
    .from("funnel_runs")
    .select("id, funnel_id, submitted_at")
    .eq("user_id", userId)
    .eq("status", "submitted")
    .gte("submitted_at", since.toISOString())
    .order("submitted_at", { ascending: false })
    .limit(1)

  if (funnelId) {
    runQuery = runQuery.eq("funnel_id", funnelId)
  }

  const { data: run, error: runError } = await runQuery.maybeSingle()

  if (runError || !run) {
    return NextResponse.json({ submission: null })
  }

  const { data: answers, error: answersError } = await admin
    .from("funnel_answers")
    .select("question_key, answer")
    .eq("run_id", run.id)

  if (answersError) {
    return NextResponse.json({ error: answersError.message }, { status: 500 })
  }

  const answersMap = (answers ?? []).reduce(
    (acc, { question_key, answer }) => {
      acc[question_key] = (answer as { text?: string })?.text ?? answer
      return acc
    },
    {} as Record<string, unknown>
  )

  let mappedAnswers: Record<string, unknown> | undefined
  let questionMapping: Record<string, string> | undefined

  const { data: funnel } = await admin
    .from("funnel_definitions")
    .select("question_mapping")
    .eq("id", run.funnel_id)
    .single()

  const mapping = (funnel?.question_mapping ?? {}) as Record<string, string>
  if (Object.keys(mapping).length > 0) {
    questionMapping = mapping
    mappedAnswers = {}
    for (const [semanticKey, qKey] of Object.entries(mapping)) {
      const val = answersMap[qKey]
      if (val !== undefined && val !== null && val !== "") {
        mappedAnswers[semanticKey] = val
      }
    }
  }

  return NextResponse.json({
    submission: {
      runId: run.id,
      funnelId: run.funnel_id,
      submittedAt: run.submitted_at,
      answers: answersMap,
      mappedAnswers,
      questionMapping,
    },
  })
}
