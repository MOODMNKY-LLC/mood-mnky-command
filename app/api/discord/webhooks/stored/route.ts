import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireDiscordAdmin } from "@/lib/discord/auth"

/**
 * GET /api/discord/webhooks/stored?guildId=...
 * Returns webhooks stored in DB (for execute). Never returns token.
 */
export async function GET(request: NextRequest) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  const guildId = request.nextUrl.searchParams.get("guildId")
  if (!guildId) {
    return NextResponse.json({ error: "guildId is required" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: rows, error } = await admin
    .from("discord_webhooks")
    .select("id, webhook_id, channel_id, guild_id, name, avatar, created_at, last_used_at")
    .eq("guild_id", guildId)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ webhooks: rows ?? [] })
}
