import { NextRequest, NextResponse } from "next/server"
import { discordJson, parseRateLimitError } from "@/lib/discord/api"
import { requireDiscordAdmin } from "@/lib/discord/auth"

/**
 * POST /api/discord/moderation
 * Body: { action: 'timeout'|'kick'|'ban'|'unban', guildId, userId, ... }
 * - timeout: communication_disabled_until (ISO8601, max 28 days) or null to remove
 * - kick: no extra body
 * - ban: optional delete_message_seconds (0–604800)
 * - unban: no extra body
 * auditLogReason optional for all.
 */
export async function POST(request: NextRequest) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  let body: {
    action?: "timeout" | "kick" | "ban" | "unban"
    guildId?: string
    userId?: string
    communication_disabled_until?: string | null
    delete_message_seconds?: number
    auditLogReason?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { action, guildId, userId, auditLogReason, ...rest } = body
  if (!action || !guildId || !userId) {
    return NextResponse.json(
      { error: "action, guildId, and userId are required" },
      { status: 400 }
    )
  }

  const reason = auditLogReason?.slice(0, 512)

  try {
    if (action === "timeout") {
      await discordJson(
        `/guilds/${guildId}/members/${userId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            communication_disabled_until: rest.communication_disabled_until ?? null,
          }),
          auditLogReason: reason,
        }
      )
      return NextResponse.json({ success: true })
    }

    if (action === "kick") {
      await discordJson(
        `/guilds/${guildId}/members/${userId}`,
        { method: "DELETE", auditLogReason: reason }
      )
      return NextResponse.json({ success: true })
    }

    if (action === "ban") {
      await discordJson(
        `/guilds/${guildId}/bans/${userId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            delete_message_seconds: rest.delete_message_seconds ?? 0,
          }),
          auditLogReason: reason,
        }
      )
      return NextResponse.json({ success: true })
    }

    if (action === "unban") {
      await discordJson(
        `/guilds/${guildId}/bans/${userId}`,
        { method: "DELETE", auditLogReason: reason }
      )
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (e) {
    const rl = parseRateLimitError(e)
    if (rl) return NextResponse.json({ error: rl.message, retryAfter: rl.retryAfter }, { status: 429 })
    const message = e instanceof Error ? e.message : "Discord API error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
