import { NextRequest, NextResponse } from "next/server"
import { discordJson } from "@/lib/discord/api"
import { parseRateLimitError } from "@/lib/discord/api"
import { requireDiscordAdmin } from "@/lib/discord/auth"

/**
 * POST /api/discord/send
 * Body: { channelId: string, content: string, auditLogReason?: string }
 * Send a message to a channel. Requires LABZ admin.
 */
export async function POST(request: NextRequest) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  let body: { channelId?: string; content?: string; auditLogReason?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { channelId, content, auditLogReason } = body
  if (!channelId || typeof content !== "string") {
    return NextResponse.json(
      { error: "channelId and content are required" },
      { status: 400 }
    )
  }

  if (content.length > 2000) {
    return NextResponse.json(
      { error: "content must be 2000 characters or less" },
      { status: 400 }
    )
  }

  try {
    const result = await discordJson<{ id: string }>(
      `/channels/${channelId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ content, allowed_mentions: { parse: [] as string[] } }),
        auditLogReason: auditLogReason?.slice(0, 512),
      }
    )
    return NextResponse.json({ messageId: result?.id, success: true })
  } catch (e) {
    const rl = parseRateLimitError(e)
    if (rl) return NextResponse.json({ error: rl.message, retryAfter: rl.retryAfter }, { status: 429 })
    const message = e instanceof Error ? e.message : "Discord API error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
