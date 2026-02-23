import { NextRequest, NextResponse } from "next/server"
import { requireDiscordAdmin } from "@/lib/discord/auth"

/**
 * GET /api/discord/primary-guild?guildId=...
 * Returns whether the given guild is the configured primary (DISCORD_GUILD_ID_MNKY_VERSE).
 * Used by LABZ Platform → Discord to show a "Primary server" badge.
 */
export async function GET(request: NextRequest) {
  const auth = await requireDiscordAdmin(request)
  if (!auth.ok) return auth.response

  const guildId = request.nextUrl.searchParams.get("guildId")
  const primaryId = process.env.DISCORD_GUILD_ID_MNKY_VERSE

  return NextResponse.json({
    isPrimary: Boolean(guildId && primaryId && guildId === primaryId),
  })
}
