import { NextRequest, NextResponse } from "next/server"
import { discordJson, parseRateLimitError } from "@/lib/discord/api"
import { requireDiscordAdmin } from "@/lib/discord/auth"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * PATCH /api/discord/webhooks/[id] — body: { name?, avatar?, channel_id? }, auditLogReason?
 * DELETE /api/discord/webhooks/[id] — auditLogReason? in body or query
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  const { id } = await params
  let body: { name?: string; avatar?: string | null; channel_id?: string; auditLogReason?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { auditLogReason, ...rest } = body
  if (Object.keys(rest).length === 0) {
    return NextResponse.json({ error: "Provide name, avatar, or channel_id" }, { status: 400 })
  }

  try {
    await discordJson(`/webhooks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(rest),
      auditLogReason: auditLogReason?.slice(0, 512),
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    const rl = parseRateLimitError(e)
    if (rl) return NextResponse.json({ error: rl.message, retryAfter: rl.retryAfter }, { status: 429 })
    const message = e instanceof Error ? e.message : "Discord API error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  const { id } = await params
  let auditLogReason: string | undefined
  try {
    const body = await request.json().catch(() => ({})) as { auditLogReason?: string }
    auditLogReason = body.auditLogReason ?? request.nextUrl.searchParams.get("auditLogReason") ?? undefined
  } catch {
    // no body
  }

  try {
    await discordJson(`/webhooks/${id}`, {
      method: "DELETE",
      auditLogReason: auditLogReason?.slice(0, 512),
    })
    const admin = createAdminClient()
    await admin.from("discord_webhooks").delete().eq("webhook_id", id)
    return NextResponse.json({ success: true })
  } catch (e) {
    const rl = parseRateLimitError(e)
    if (rl) return NextResponse.json({ error: rl.message, retryAfter: rl.retryAfter }, { status: 429 })
    const message = e instanceof Error ? e.message : "Discord API error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
