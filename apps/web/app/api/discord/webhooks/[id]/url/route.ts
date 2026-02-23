import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { decryptWebhookToken } from "@/lib/discord/webhook-token"
import { requireDiscordAdmin } from "@/lib/discord/auth"

const DISCORD_WEBHOOK_BASE = "https://discord.com/api/webhooks"

/**
 * GET /api/discord/webhooks/[id]/url
 * Returns { url: string } for a stored webhook (id = Discord webhook_id).
 * Used so the backoffice can copy the webhook URL. Auth: Discord admin only.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireDiscordAdmin(_request)
  if (!auth.ok) return auth.response

  const { id: webhookId } = await params
  if (!webhookId) {
    return NextResponse.json({ error: "Webhook id required" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: row, error } = await admin
    .from("discord_webhooks")
    .select("token_encrypted")
    .eq("webhook_id", webhookId)
    .single()

  if (error || !row?.token_encrypted) {
    return NextResponse.json({ error: "Webhook not found or not stored" }, { status: 404 })
  }

  let token: string
  try {
    token = decryptWebhookToken(row.token_encrypted)
  } catch {
    return NextResponse.json(
      { error: "Failed to decrypt webhook token" },
      { status: 500 }
    )
  }

  const url = `${DISCORD_WEBHOOK_BASE}/${webhookId}/${token}`
  return NextResponse.json({ url })
}
