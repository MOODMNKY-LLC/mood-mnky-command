import { NextRequest, NextResponse } from "next/server"
import { discordJson, parseRateLimitError } from "@/lib/discord/api"
import { requireDiscordAdmin } from "@/lib/discord/auth"

/**
 * GET /api/discord/roles?guildId=...
 * POST /api/discord/roles { guildId, name?, permissions?, color?, hoist?, mentionable? } — create role
 */
export async function GET(request: NextRequest) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  const guildId = request.nextUrl.searchParams.get("guildId")
  if (!guildId) {
    return NextResponse.json({ error: "guildId is required" }, { status: 400 })
  }

  try {
    const roles = await discordJson<DiscordRole[]>(`/guilds/${guildId}/roles`)
    return NextResponse.json({ roles })
  } catch (e) {
    const rl = parseRateLimitError(e)
    if (rl) return NextResponse.json({ error: rl.message, retryAfter: rl.retryAfter }, { status: 429 })
    const message = e instanceof Error ? e.message : "Discord API error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  let body: {
    guildId?: string
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

  const { guildId, auditLogReason, ...rest } = body
  if (!guildId) {
    return NextResponse.json({ error: "guildId is required" }, { status: 400 })
  }

  try {
    const role = await discordJson<DiscordRole>(`/guilds/${guildId}/roles`, {
      method: "POST",
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

interface DiscordRole {
  id: string
  name: string
  color: number
  hoist: boolean
  mentionable: boolean
  permissions: string
  position: number
}
