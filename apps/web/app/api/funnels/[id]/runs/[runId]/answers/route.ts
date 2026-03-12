/**
 * Submit answers from inline intake form.
 * Creates/updates funnel_answers. Uses question_mapping to store with q1, q2 keys when available.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: funnelId, runId } = await params

  const { data: run, error: runError } = await supabase
    .from("funnel_runs")
    .select("id, funnel_id, user_id")
    .eq("id", runId)
    .eq("funnel_id", funnelId)
    .single()

  if (runError || !run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 })
  }

  if (run.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: funnel, error: funnelError } = await supabase
    .from("funnel_definitions")
    .select("question_mapping")
    .eq("id", funnelId)
    .single()

  if (funnelError || !funnel) {
    return NextResponse.json({ error: "Funnel not found" }, { status: 404 })
  }

  let body: Record<string, string | string[]>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const mapping = (funnel.question_mapping ?? {}) as Record<string, string>

  const entries = Object.entries(body).filter(
    ([k]) => k !== "run_id" && k !== "user_id"
  )
  if (entries.length === 0) {
    return NextResponse.json(
      { error: "At least one answer is required" },
      { status: 400 }
    )
  }

  const answerRows = entries.map(([semanticKey, value]) => {
    const questionKey = mapping[semanticKey] ?? semanticKey
    const answerValue =
      typeof value === "string"
        ? { text: value }
        : Array.isArray(value)
          ? { text: value.join(", ") }
          : { text: String(value) }
    return {
      run_id: runId,
      question_key: questionKey,
      answer: answerValue,
    }
  })

  const { error: deleteError } = await supabase
    .from("funnel_answers")
    .delete()
    .eq("run_id", runId)

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 }
    )
  }

  const { error: insertError } = await supabase
    .from("funnel_answers")
    .insert(answerRows)

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    )
  }

  const { error: updateError } = await supabase
    .from("funnel_runs")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      context: { source: "inline_form" },
    })
    .eq("id", runId)

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    runId,
    message: "Answers submitted",
  })
}
