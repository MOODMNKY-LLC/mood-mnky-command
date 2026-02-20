import { NextRequest, NextResponse } from "next/server"
import { discordJson } from "@/lib/discord/api"
import { parseRateLimitError } from "@/lib/discord/api"
import { requireDiscordAdmin } from "@/lib/discord/auth"

/**
 * POST /api/discord/forum
 * Body: { channelId: string, name: string, message: string, auditLogReason?: string }
 * Create a forum post (thread) in a forum channel. Requires LABZ admin.
 * channelId must be a forum channel (type 15).
 */
export async function POST(request: NextRequest) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  let body: { channelId?: string; name?: string; message?: string; auditLogReason?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { channelId, name, message, auditLogReason } = body
  if (!channelId || typeof name !== "string" || typeof message !== "string") {
    return NextResponse.json(
      { error: "channelId, name, and message are required" },
      { status: 400 }
    )
  }

  if (name.length > 100) {
    return NextResponse.json(
      { error: "name must be 100 characters or less" },
      { status: 400 }
    )
  }
  if (message.length > 2000) {
    return NextResponse.json(
      { error: "message must be 2000 characters or less" },
      { status: 400 }
    )
  }

  try {
    const result = await discordJson<{ id: string }>(
      `/channels/${channelId}/threads`,
      {
        method: "POST",
        body: JSON.stringify({
          name,
          message: { content: message },
        }),
        auditLogReason: auditLogReason?.slice(0, 512),
      }
    )
    return NextResponse.json({ threadId: result?.id, success: true })
  } catch (e) {
    const rl = parseRateLimitError(e)
    if (rl) return NextResponse.json({ error: rl.message, retryAfter: rl.retryAfter }, { status: 429 })
    const errMessage = e instanceof Error ? e.message : "Discord API error"
    return NextResponse.json({ error: errMessage }, { status: 502 })
  }
}
