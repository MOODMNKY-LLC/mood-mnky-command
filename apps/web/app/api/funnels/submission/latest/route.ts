import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/funnels/submission/latest?withinHours=24
 * Returns the user's most recent submitted funnel run and answers.
 * Used by Product Builder "Build from Intake" to prefill from JotForm intake.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const withinHours = Math.min(168, Math.max(1, parseInt(searchParams.get("withinHours") ?? "24", 10)))

  const since = new Date()
  since.setHours(since.getHours() - withinHours)

  const { data: run, error: runError } = await supabase
    .from("funnel_runs")
    .select("id, funnel_id, submitted_at")
    .eq("user_id", user.id)
    .eq("status", "submitted")
    .gte("submitted_at", since.toISOString())
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (runError || !run) {
    return NextResponse.json({ submission: null })
  }

  const { data: answers, error: answersError } = await supabase
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

  const { data: funnel } = await supabase
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
