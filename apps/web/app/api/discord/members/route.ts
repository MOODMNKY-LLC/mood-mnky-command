import { NextRequest, NextResponse } from "next/server"
import { discordJson, parseRateLimitError } from "@/lib/discord/api"
import { requireDiscordAdmin } from "@/lib/discord/auth"

/**
 * GET /api/discord/members?guildId=...&limit=...&after=... — list members (requires GUILD_MEMBERS intent)
 * GET /api/discord/members?guildId=...&query=... — search members
 */
export async function GET(request: NextRequest) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  const guildId = request.nextUrl.searchParams.get("guildId")
  if (!guildId) {
    return NextResponse.json({ error: "guildId is required" }, { status: 400 })
  }

  const query = request.nextUrl.searchParams.get("query")
  const limit = request.nextUrl.searchParams.get("limit")
  const after = request.nextUrl.searchParams.get("after")

  try {
    if (query != null && query !== "") {
      const members = await discordJson<DiscordMember[]>(
        `/guilds/${guildId}/members/search?query=${encodeURIComponent(query)}${limit ? `&limit=${Math.min(1000, parseInt(limit, 10) || 1)}` : ""}`
      )
      return NextResponse.json({ members })
    }
    const members = await discordJson<DiscordMember[]>(
      `/guilds/${guildId}/members?limit=${Math.min(1000, parseInt(limit || "100", 10) || 100)}${after ? `&after=${after}` : ""}`
    )
    return NextResponse.json({ members })
  } catch (e) {
    const rl = parseRateLimitError(e)
    if (rl) return NextResponse.json({ error: rl.message, retryAfter: rl.retryAfter }, { status: 429 })
    const message = e instanceof Error ? e.message : "Discord API error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

interface DiscordMember {
  user?: { id: string; username: string; discriminator: string; avatar: string | null }
  nick?: string | null
  roles: string[]
  joined_at: string
}
