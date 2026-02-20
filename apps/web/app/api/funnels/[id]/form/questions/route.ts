/**
 * Sync questions to an existing JotForm form.
 * Adds new questions via addQuestion; does not support full replace.
 */

import { NextRequest, NextResponse } from "next/server"
import { authenticateFunnelAdmin } from "@/lib/auth/funnel-admin"
import { addQuestion, getQuestions } from "@/lib/jotform/client"
import type { FormQuestion } from "@/lib/jotform/types"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateFunnelAdmin(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const { data: funnel, error: fetchError } = await auth.supabase
    .from("funnel_definitions")
    .select("id, provider_form_id, question_mapping")
    .eq("id", id)
    .single()

  if (fetchError || !funnel) {
    return NextResponse.json({ error: "Funnel not found" }, { status: 404 })
  }

  if (!funnel.provider_form_id) {
    return NextResponse.json(
      { error: "Funnel has no form. Create form first." },
      { status: 400 }
    )
  }

  let body: { questions: FormQuestion[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { questions } = body
  if (!questions || !Array.isArray(questions)) {
    return NextResponse.json(
      { error: "questions array is required" },
      { status: 400 }
    )
  }

  const existingQuestions = await getQuestions(funnel.provider_form_id)
  const maxOrder = Math.max(
    0,
    ...Object.values(existingQuestions).map((q) =>
      parseInt(String((q as { order?: string }).order ?? "0"), 10)
    )
  )

  const mapping = (funnel.question_mapping ?? {}) as Record<string, string>
  const newMapping = { ...mapping }

  try {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      await addQuestion(funnel.provider_form_id, {
        ...q,
        order: maxOrder + i + 1,
      })
    }

    const updatedQuestions = await getQuestions(funnel.provider_form_id)
    const sortedNew = Object.entries(updatedQuestions)
      .filter(([qid]) => !(qid in existingQuestions))
      .sort(
        ([, a], [, b]) =>
          parseInt(String((a as { order?: string }).order ?? "0"), 10) -
          parseInt(String((b as { order?: string }).order ?? "0"), 10)
      )
    sortedNew.forEach(([qid], idx) => {
      const ourQ = questions[idx]
      if (
        ourQ?.semanticKey &&
        ourQ.semanticKey !== "run_id" &&
        ourQ.semanticKey !== "user_id"
      ) {
        newMapping[ourQ.semanticKey] = `q${qid}`
      }
    })

    await auth.supabase
      .from("funnel_definitions")
      .update({
        question_mapping: newMapping,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    return NextResponse.json({ ok: true, questionMapping: newMapping })
  } catch (err) {
    const message = err instanceof Error ? err.message : "JotForm API error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
