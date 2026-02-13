import { NextRequest, NextResponse } from "next/server"
import { authenticateFunnelAdmin } from "@/lib/auth/funnel-admin"
import { createWebhook } from "@/lib/jotform/client"
import { getJotformWebhookSecret } from "@/lib/jotform/config"

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
    .select("id, provider_form_id, webhook_id")
    .eq("id", id)
    .single()

  if (fetchError || !funnel) {
    return NextResponse.json({ error: "Funnel not found" }, { status: 404 })
  }

  const baseUrl = getWebhookBaseUrl()
  const secret = getJotformWebhookSecret()
  const webhookPath = secret
    ? `/api/jotform/webhook?token=${encodeURIComponent(secret)}`
    : "/api/jotform/webhook"
  const webhookUrl = `${baseUrl}${webhookPath}`

  try {
    const webhookId = await createWebhook(funnel.provider_form_id, webhookUrl)

    const { error: updateError } = await auth.supabase
      .from("funnel_definitions")
      .update({
        webhook_id: webhookId,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      webhookId,
      webhookUrl,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "JotForm API error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
