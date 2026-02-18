import { NextRequest, NextResponse } from "next/server"
import { discordJson, parseRateLimitError } from "@/lib/discord/api"
import { requireDiscordAdmin } from "@/lib/discord/auth"

/**
 * PATCH /api/discord/roles/[roleId]?guildId=... — body: { name?, permissions?, color?, hoist?, mentionable? }, auditLogReason?
 * DELETE /api/discord/roles/[roleId]?guildId=... — auditLogReason? in body
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  const guildId = request.nextUrl.searchParams.get("guildId")
  if (!guildId) {
    return NextResponse.json({ error: "guildId is required" }, { status: 400 })
  }

  const { roleId } = await params
  let body: {
    name?: string
    permissions?: string
    color?: number
    hoist?: boolean
    mentionable?: boolean
    auditLogReason?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { auditLogReason, ...rest } = body
  if (Object.keys(rest).length === 0) {
    return NextResponse.json({ error: "Provide at least one field to update" }, { status: 400 })
  }

  try {
    const role = await discordJson(`/guilds/${guildId}/roles/${roleId}`, {
      method: "PATCH",
      body: JSON.stringify(rest),
      auditLogReason: auditLogReason?.slice(0, 512),
    })
    return NextResponse.json({ role })
  } catch (e) {
    const rl = parseRateLimitError(e)
    if (rl) return NextResponse.json({ error: rl.message, retryAfter: rl.retryAfter }, { status: 429 })
    const message = e instanceof Error ? e.message : "Discord API error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  const guildId = request.nextUrl.searchParams.get("guildId")
  if (!guildId) {
    return NextResponse.json({ error: "guildId is required" }, { status: 400 })
  }

  const { roleId } = await params
  let auditLogReason: string | undefined
  try {
    const body = await request.json().catch(() => ({})) as { auditLogReason?: string }
    auditLogReason = body.auditLogReason ?? request.nextUrl.searchParams.get("auditLogReason") ?? undefined
  } catch {
    // no body
  }

  try {
    await discordJson(`/guilds/${guildId}/roles/${roleId}`, {
      method: "DELETE",
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
