/**
 * Create a JotForm form from schema and link to funnel.
 * Adds hidden run_id and user_id fields for embed tracking.
 */

import { NextRequest, NextResponse } from "next/server"
import { authenticateFunnelAdmin } from "@/lib/auth/funnel-admin"
import { createForm, createWebhook, getQuestions } from "@/lib/jotform/client"
import { getJotformWebhookSecret } from "@/lib/jotform/config"
import type { FormQuestion } from "@/lib/jotform/types"

function getWebhookBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3000"
  return url.replace(/\/$/, "")
}

export async function POST(
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
    .select("id, name, provider_form_id")
    .eq("id", id)
    .single()

  if (fetchError || !funnel) {
    return NextResponse.json({ error: "Funnel not found" }, { status: 404 })
  }

  let body: {
    questions: FormQuestion[]
    title?: string
    registerWebhook?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { questions, title, registerWebhook = true } = body
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json(
      { error: "questions array is required" },
      { status: 400 }
    )
  }

  const maxOrder = Math.max(0, ...questions.map((q) => q.order ?? 0))
  const hiddenFields: FormQuestion[] = [
    {
      type: "hidden",
      text: "run_id",
      order: maxOrder + 1,
      name: "run_id",
      semanticKey: "run_id",
    },
    {
      type: "hidden",
      text: "user_id",
      order: maxOrder + 2,
      name: "user_id",
      semanticKey: "user_id",
    },
  ]

  const allQuestions = [...questions, ...hiddenFields].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  )

  try {
    const formId = await createForm({
      properties: {
        title: title ?? funnel.name ?? "Form",
        height: 600,
      },
      questions: allQuestions,
    })

    if (!formId) {
      return NextResponse.json(
        { error: "JotForm did not return a form ID" },
        { status: 500 }
      )
    }

    const jotformQuestions = await getQuestions(formId)
    const sortedJotform = Object.entries(jotformQuestions).sort(
      ([, a], [, b]) =>
        parseInt(String((a as { order?: string }).order ?? "0"), 10) -
        parseInt(String((b as { order?: string }).order ?? "0"), 10)
    )
    const questionMapping: Record<string, string> = {}
    sortedJotform.forEach(([qid], idx) => {
      const ourQ = allQuestions[idx]
      if (
        ourQ?.semanticKey &&
        ourQ.semanticKey !== "run_id" &&
        ourQ.semanticKey !== "user_id"
      ) {
        questionMapping[ourQ.semanticKey] = `q${qid}`
      }
    })

    const formSchema = questions.map((q) => ({
      type: q.type,
      text: q.text,
      order: q.order ?? 0,
      name: q.name,
      required: q.required,
      options: q.options,
      semanticKey: q.semanticKey,
    }))

    const { error: updateError } = await auth.supabase
      .from("funnel_definitions")
      .update({
        provider_form_id: formId,
        question_mapping: questionMapping,
        form_schema: formSchema,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    let webhookId: string | undefined
    if (registerWebhook) {
      const baseUrl = getWebhookBaseUrl()
      const secret = getJotformWebhookSecret()
      const webhookPath = secret
        ? `/api/jotform/webhook?token=${encodeURIComponent(secret)}`
        : "/api/jotform/webhook"
      const webhookUrl = `${baseUrl}${webhookPath}`
      webhookId = await createWebhook(formId, webhookUrl)
      await auth.supabase
        .from("funnel_definitions")
        .update({
          webhook_id: webhookId,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
    }

    return NextResponse.json({
      ok: true,
      formId,
      webhookId,
      questionMapping,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "JotForm API error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
