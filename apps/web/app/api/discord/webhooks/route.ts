import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { discordFetch, discordJson, parseRateLimitError } from "@/lib/discord/api"
import { requireDiscordAdmin } from "@/lib/discord/auth"
import { encryptWebhookToken } from "@/lib/discord/webhook-token"

/**
 * GET /api/discord/webhooks?guildId=... (list guild webhooks)
 * GET /api/discord/webhooks?guildId=...&channelId=... (list channel webhooks)
 * POST /api/discord/webhooks { channelId, name, avatar? } — create webhook, store token in DB, return webhook (no token in response after storage).
 */
export async function GET(request: NextRequest) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  const guildId = request.nextUrl.searchParams.get("guildId")
  const channelId = request.nextUrl.searchParams.get("channelId")
  if (!guildId && !channelId) {
    return NextResponse.json({ error: "guildId or channelId is required" }, { status: 400 })
  }

  try {
    const path = channelId
      ? `/channels/${channelId}/webhooks`
      : `/guilds/${guildId}/webhooks`
    const webhooks = await discordJson<DiscordWebhook[]>(path)
    return NextResponse.json({ webhooks })
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

  let body: { channelId?: string; name?: string; avatar?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { channelId, name, avatar } = body
  if (!channelId || typeof name !== "string" || name.length < 1 || name.length > 80) {
    return NextResponse.json(
      { error: "channelId and name (1–80 chars) are required" },
      { status: 400 }
    )
  }

  try {
    const created = await discordJson<DiscordWebhookCreated>(
      `/channels/${channelId}/webhooks`,
      {
        method: "POST",
        body: JSON.stringify({ name, avatar: avatar ?? undefined }),
      }
    )

    if (!created.token) {
      return NextResponse.json({ error: "Discord did not return webhook token" }, { status: 502 })
    }

    const encrypted = encryptWebhookToken(created.token)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const admin = createAdminClient()
    await admin.from("discord_webhooks").insert({
      webhook_id: created.id,
      channel_id: created.channel_id ?? channelId,
      guild_id: created.guild_id ?? "",
      name: created.name,
      avatar: created.avatar ?? null,
      token_encrypted: encrypted,
      created_by: user?.id ?? null,
    })

    return NextResponse.json({
      webhook: {
        id: created.id,
        channel_id: created.channel_id,
        guild_id: created.guild_id,
        name: created.name,
        avatar: created.avatar,
      },
      success: true,
    })
  } catch (e) {
    const rl = parseRateLimitError(e)
    if (rl) return NextResponse.json({ error: rl.message, retryAfter: rl.retryAfter }, { status: 429 })
    const message = e instanceof Error ? e.message : "Discord API error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

interface DiscordWebhook {
  id: string
  channel_id?: string
  guild_id?: string
  name: string
  avatar: string | null
  token?: string
}

interface DiscordWebhookCreated extends DiscordWebhook {
  token: string
}
