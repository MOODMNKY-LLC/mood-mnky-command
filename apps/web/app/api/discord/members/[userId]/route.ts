import { NextRequest, NextResponse } from "next/server"
import { discordJson, parseRateLimitError } from "@/lib/discord/api"
import { requireDiscordAdmin } from "@/lib/discord/auth"

/**
 * GET /api/discord/members/[userId]?guildId=... — get single member
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  const guildId = request.nextUrl.searchParams.get("guildId")
  if (!guildId) {
    return NextResponse.json({ error: "guildId is required" }, { status: 400 })
  }

  const { userId } = await params

  try {
    const member = await discordJson(`/guilds/${guildId}/members/${userId}`)
    return NextResponse.json({ member })
  } catch (e) {
    const rl = parseRateLimitError(e)
    if (rl) return NextResponse.json({ error: rl.message, retryAfter: rl.retryAfter }, { status: 429 })
    const message = e instanceof Error ? e.message : "Discord API error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
