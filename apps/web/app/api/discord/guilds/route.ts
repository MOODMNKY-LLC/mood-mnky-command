import { NextRequest, NextResponse } from "next/server"
import { discordJson, type DiscordGuild } from "@/lib/discord/api"
import { parseRateLimitError } from "@/lib/discord/api"
import { requireDiscordAdmin } from "@/lib/discord/auth"

/**
 * GET /api/discord/guilds
 * List guilds (servers) the bot is in. Requires LABZ admin.
 */
export async function GET(request: NextRequest) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const guilds = await discordJson<DiscordGuild[]>("/users/@me/guilds")
    return NextResponse.json({ guilds })
  } catch (e) {
    const rl = parseRateLimitError(e)
    if (rl) return NextResponse.json({ error: rl.message, retryAfter: rl.retryAfter }, { status: 429 })
    const message = e instanceof Error ? e.message : "Discord API error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
