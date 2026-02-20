import { NextRequest, NextResponse } from "next/server"
import { discordJson, parseRateLimitError } from "@/lib/discord/api"
import { requireDiscordAdmin } from "@/lib/discord/auth"

/**
 * GET /api/discord/audit-logs?guildId=...&limit=...&before=...&after=...&action_type=...&user_id=...
 */
export async function GET(request: NextRequest) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  const guildId = request.nextUrl.searchParams.get("guildId")
  if (!guildId) {
    return NextResponse.json({ error: "guildId is required" }, { status: 400 })
  }

  const limit = request.nextUrl.searchParams.get("limit")
  const before = request.nextUrl.searchParams.get("before")
  const after = request.nextUrl.searchParams.get("after")
  const action_type = request.nextUrl.searchParams.get("action_type")
  const user_id = request.nextUrl.searchParams.get("user_id")

  const params = new URLSearchParams()
  if (limit) params.set("limit", String(Math.min(100, parseInt(limit, 10) || 50)))
  if (before) params.set("before", before)
  if (after) params.set("after", after)
  if (action_type) params.set("action_type", action_type)
  if (user_id) params.set("user_id", user_id)

  const query = params.toString()

  try {
    const data = await discordJson<{ audit_log_entries: unknown[] }>(
      `/guilds/${guildId}/audit-logs${query ? `?${query}` : ""}`
    )
    return NextResponse.json(data)
  } catch (e) {
    const rl = parseRateLimitError(e)
    if (rl) return NextResponse.json({ error: rl.message, retryAfter: rl.retryAfter }, { status: 429 })
    const message = e instanceof Error ? e.message : "Discord API error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
