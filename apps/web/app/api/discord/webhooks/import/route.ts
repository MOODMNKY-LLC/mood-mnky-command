import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { discordJson, parseRateLimitError } from "@/lib/discord/api"
import { requireDiscordAdmin } from "@/lib/discord/auth"
import { encryptWebhookToken } from "@/lib/discord/webhook-token"

/**
 * Parse Discord webhook URL into { webhookId, token }.
 * Accepts https://discord.com/api/webhooks/{id}/{token} or discordapp.com.
 * Id = snowflake (numeric string), token = alphanumeric + allowed chars.
 */
function parseWebhookUrl(url: string): { webhookId: string; token: string } | null {
  const trimmed = url.trim()
  try {
    const u = new URL(trimmed)
    if (u.protocol !== "https:") return null
    if (u.hostname !== "discord.com" && u.hostname !== "discordapp.com") return null
    const path = u.pathname
    const match = /^\/api\/webhooks\/([0-9]{17,19})\/([A-Za-z0-9_.-]+)\/?$/.exec(path)
    if (!match) return null
    const [, webhookId, token] = match
    if (!webhookId || !token || token.length < 1) return null
    return { webhookId, token }
  } catch {
    return null
  }
}

interface DiscordWebhookMeta {
  id: string
  channel_id?: string
  guild_id?: string
  name?: string
  avatar?: string | null
}

/**
 * POST /api/discord/webhooks/import
 * Body: { url: string }
 * Parses webhook URL, fetches metadata from Discord (GET /webhooks/{id}), stores token encrypted.
 * On duplicate webhook_id, updates token_encrypted (re-import updates token).
 */
export async function POST(request: NextRequest) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  let body: { url?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const rawUrl = typeof body.url === "string" ? body.url : ""
  const parsed = parseWebhookUrl(rawUrl)
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid webhook URL. Use https://discord.com/api/webhooks/{id}/{token}" },
      { status: 400 }
    )
  }

  const { webhookId, token } = parsed

  try {
    const meta = await discordJson<DiscordWebhookMeta>(`/webhooks/${webhookId}`)
    const channelId = meta.channel_id ?? ""
    const guildId = meta.guild_id ?? ""
    const name = meta.name ?? "Imported webhook"
    const avatar = meta.avatar ?? null

    if (!channelId || !guildId) {
      return NextResponse.json(
        { error: "Webhook metadata missing channel_id or guild_id" },
        { status: 502 }
      )
    }

    const encrypted = encryptWebhookToken(token)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const admin = createAdminClient()

    const row = {
      webhook_id: webhookId,
      channel_id: channelId,
      guild_id: guildId,
      name: name.slice(0, 80),
      avatar,
      token_encrypted: encrypted,
      created_by: user?.id ?? null,
    }

    const { error: insertError } = await admin
      .from("discord_webhooks")
      .upsert(row, {
        onConflict: "webhook_id",
        ignoreDuplicates: false,
      })

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message ?? "Failed to store webhook" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      webhook: {
        id: webhookId,
        channel_id: channelId,
        guild_id: guildId,
        name: row.name,
        avatar: row.avatar,
      },
      success: true,
    })
  } catch (e) {
    const rl = parseRateLimitError(e)
    if (rl) {
      return NextResponse.json(
        { error: rl.message, retryAfter: rl.retryAfter },
        { status: 429 }
      )
    }
    const message = e instanceof Error ? e.message : "Discord API error"
    if (message.includes("404") || message.includes("403")) {
      return NextResponse.json(
        { error: "Webhook not found or bot has no access to it" },
        { status: 404 }
      )
    }
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
