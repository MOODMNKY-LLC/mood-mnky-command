import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { decryptWebhookToken } from "@/lib/discord/webhook-token"
import { requireDiscordAdmin } from "@/lib/discord/auth"

const DISCORD_API_BASE = "https://discord.com/api/v10"

/**
 * POST /api/discord/webhooks/execute
 * Body: { webhookId: string, content?, embeds?, components?, allowed_mentions?, thread_id? }
 * Executes a stored webhook (token looked up from DB). Requires MNKY LABZ admin.
 */
export async function POST(request: NextRequest) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  let body: {
    webhookId?: string
    content?: string
    embeds?: unknown[]
    components?: unknown[]
    allowed_mentions?: { parse?: string[]; users?: string[]; roles?: string[] }
    thread_id?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { webhookId, thread_id, ...payload } = body
  if (!webhookId) {
    return NextResponse.json({ error: "webhookId is required" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: row, error: rowError } = await admin
    .from("discord_webhooks")
    .select("token_encrypted")
    .eq("webhook_id", webhookId)
    .single()

  if (rowError || !row?.token_encrypted) {
    return NextResponse.json({ error: "Webhook not found or token missing" }, { status: 404 })
  }

  let token: string
  try {
    token = decryptWebhookToken(row.token_encrypted)
  } catch {
    return NextResponse.json({ error: "Failed to decrypt webhook token" }, { status: 500 })
  }

  const sendPayload = {
    content: payload.content ?? undefined,
    embeds: payload.embeds ?? undefined,
    components: payload.components ?? undefined,
    allowed_mentions: payload.allowed_mentions ?? { parse: [] },
  }

  const url = new URL(`/webhooks/${webhookId}/${token}`, DISCORD_API_BASE)
  if (thread_id) url.searchParams.set("thread_id", thread_id)

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sendPayload),
  })

  if (res.status === 429) {
    const data = await res.json().catch(() => ({})) as { retry_after?: number }
    return NextResponse.json(
      { error: "Discord rate limit", retryAfter: data.retry_after ?? 1 },
      { status: 429 }
    )
  }

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: `Discord ${res.status}: ${text}` }, { status: 502 })
  }

  await admin
    .from("discord_webhooks")
    .update({ last_used_at: new Date().toISOString() })
    .eq("webhook_id", webhookId)

  const result = res.status === 204 ? null : await res.json()
  return NextResponse.json({ success: true, message: result })
}
