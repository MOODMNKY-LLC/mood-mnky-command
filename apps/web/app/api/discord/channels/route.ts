import { NextRequest, NextResponse } from "next/server"
import { discordJson, type DiscordChannel } from "@/lib/discord/api"
import { parseRateLimitError } from "@/lib/discord/api"
import { requireDiscordAdmin } from "@/lib/discord/auth"

/**
 * GET /api/discord/channels?guildId=...
 * List channels in a guild. Requires LABZ admin.
 */
export async function GET(request: NextRequest) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  const guildId = request.nextUrl.searchParams.get("guildId")
  if (!guildId) {
    return NextResponse.json({ error: "guildId is required" }, { status: 400 })
  }

  try {
    const channels = await discordJson<DiscordChannel[]>(`/guilds/${guildId}/channels`)
    return NextResponse.json({ channels })
  } catch (e) {
    const rl = parseRateLimitError(e)
    if (rl) return NextResponse.json({ error: rl.message, retryAfter: rl.retryAfter }, { status: 429 })
    const message = e instanceof Error ? e.message : "Discord API error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
