/**
 * JotForm webhook ingestion route.
 * Accepts POST from JotForm on form submission.
 * Idempotent on provider_submission_id. Uses service role to bypass RLS.
 */

import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getJotformWebhookSecret } from "@/lib/jotform/config"

export async function POST(request: NextRequest) {
  const secret = getJotformWebhookSecret()
  if (secret) {
    const token = request.nextUrl.searchParams.get("token")
    if (token !== secret) {
      return NextResponse.json({ error: "Invalid webhook token" }, { status: 401 })
    }
  }

  let body: Record<string, string>
  const contentType = request.headers.get("content-type") ?? ""
  try {
    if (contentType.includes("application/json")) {
      body = (await request.json()) as Record<string, string>
    } else {
      const text = await request.text()
      body = Object.fromEntries(new URLSearchParams(text))
    }
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const rawRequest = body.rawRequest
  let submission: {
    id?: string
    form_id?: string
    answers?: Record<
      string,
      { name?: string; text?: string; answer?: string; order?: string }
    >
  } = {}

  if (rawRequest) {
    try {
      submission = JSON.parse(rawRequest) as typeof submission
    } catch {
      // fallback to flat body
    }
  }

  if (!submission.id && body.submissionID) {
    submission.id = body.submissionID
  }
  if (!submission.form_id && body.formID) {
    submission.form_id = body.formID
  }

  const providerSubmissionId = submission.id ?? body.submissionID
  const providerFormId = submission.form_id ?? body.formID

  if (!providerSubmissionId || !providerFormId) {
    return NextResponse.json(
      { error: "Missing submissionID or formID" },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { data: funnelDef } = await supabase
    .from("funnel_definitions")
    .select("id")
    .eq("provider", "jotform")
    .eq("provider_form_id", providerFormId)
    .or("status.eq.active,sandbox.eq.true")
    .single()

  if (!funnelDef) {
    return NextResponse.json(
      { error: "Unknown form or funnel inactive" },
      { status: 404 }
    )
  }

  const runId = body.run_id ?? null
  const userId = body.user_id ?? null

  const answers = submission.answers ?? {}
  const answerEntries = Object.entries(answers).map(([qid, a]) => {
    const ans = a as { text?: string; answer?: string; name?: string }
    return {
      question_key: `q${qid}`,
      answer: {
        text: ans.text ?? ans.answer ?? "",
        name: ans.name,
      },
    }
  })

  try {
    const { data: existingBySubmission } = await supabase
      .from("funnel_runs")
      .select("id")
      .eq("provider_submission_id", providerSubmissionId)
      .single()

    if (existingBySubmission) {
      return NextResponse.json({ ok: true, duplicate: true })
    }

    let runIdRes: string

    if (runId) {
      const { data: existingRun, error: updateErr } = await supabase
        .from("funnel_runs")
        .update({
          status: "submitted",
          provider_submission_id: providerSubmissionId,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", runId)
        .eq("funnel_id", funnelDef.id)
        .select("id")
        .single()

      if (updateErr || !existingRun) {
        console.error("JotForm webhook run update error:", updateErr)
        return NextResponse.json(
          { error: "Database error" },
          { status: 500 }
        )
      }
      runIdRes = existingRun.id
    } else {
      const { data: run, error: runError } = await supabase
        .from("funnel_runs")
        .insert({
          funnel_id: funnelDef.id,
          user_id: userId || null,
          status: "submitted",
          provider_submission_id: providerSubmissionId,
          submitted_at: new Date().toISOString(),
          context: {},
        })
        .select("id")
        .single()

      if (runError) {
        if (runError.code === "23505") {
          return NextResponse.json({ ok: true, duplicate: true })
        }
        console.error("JotForm webhook run insert error:", runError)
        return NextResponse.json(
          { error: "Database error" },
          { status: 500 }
        )
      }
      runIdRes = run!.id
    }

    if (answerEntries.length > 0) {
      await supabase.from("funnel_answers").insert(
        answerEntries.map((e) => ({
          run_id: runIdRes,
          question_key: e.question_key,
          answer: e.answer,
        }))
      )
    }

    await supabase.from("funnel_events").insert({
      run_id: runIdRes,
      type: "webhook_received",
      payload: body,
    })
  } catch (err) {
    console.error("JotForm webhook error:", err)
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
