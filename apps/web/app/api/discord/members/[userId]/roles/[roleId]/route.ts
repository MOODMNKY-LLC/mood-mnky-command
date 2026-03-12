import { NextRequest, NextResponse } from "next/server"
import { discordJson, parseRateLimitError } from "@/lib/discord/api"
import { requireDiscordAdmin } from "@/lib/discord/auth"

/**
 * PUT /api/discord/members/[userId]/roles/[roleId]?guildId=... — add role to member (body: auditLogReason?)
 * DELETE /api/discord/members/[userId]/roles/[roleId]?guildId=... — remove role (body: auditLogReason?)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; roleId: string }> }
) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  const guildId = request.nextUrl.searchParams.get("guildId")
  if (!guildId) {
    return NextResponse.json({ error: "guildId is required" }, { status: 400 })
  }

  const { userId, roleId } = await params
  let auditLogReason: string | undefined
  try {
    const body = await request.json().catch(() => ({})) as { auditLogReason?: string }
    auditLogReason = body.auditLogReason
  } catch {
    // no body
  }

  try {
    await discordJson(
      `/guilds/${guildId}/members/${userId}/roles/${roleId}`,
      {
        method: "PUT",
        auditLogReason: auditLogReason?.slice(0, 512),
      }
    )
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
  { params }: { params: Promise<{ userId: string; roleId: string }> }
) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  const guildId = request.nextUrl.searchParams.get("guildId")
  if (!guildId) {
    return NextResponse.json({ error: "guildId is required" }, { status: 400 })
  }

  const { userId, roleId } = await params
  let auditLogReason: string | undefined
  try {
    const body = await request.json().catch(() => ({})) as { auditLogReason?: string }
    auditLogReason = body.auditLogReason
  } catch {
    // no body
  }

  try {
    await discordJson(
      `/guilds/${guildId}/members/${userId}/roles/${roleId}`,
      {
        method: "DELETE",
        auditLogReason: auditLogReason?.slice(0, 512),
      }
    )
    return NextResponse.json({ success: true })
  } catch (e) {
    const rl = parseRateLimitError(e)
    if (rl) return NextResponse.json({ error: rl.message, retryAfter: rl.retryAfter }, { status: 429 })
    const message = e instanceof Error ? e.message : "Discord API error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
