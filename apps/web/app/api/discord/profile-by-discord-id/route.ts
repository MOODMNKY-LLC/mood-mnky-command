import { NextResponse } from "next/server"
import { requireInternalApiKey } from "@/lib/api/internal-auth"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/discord/profile-by-discord-id?discordUserId=...
 * Returns { profileId: string | null } for the profile linked to this Discord user.
 * Auth: Bearer MOODMNKY_API_KEY (used by Discord bots for event ingestion).
 */
export async function GET(request: Request) {
  if (!requireInternalApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const discordUserId = searchParams.get("discordUserId")
  if (!discordUserId?.trim()) {
    return NextResponse.json(
      { error: "discordUserId query parameter is required" },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("discord_user_id", discordUserId.trim())
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { error: "Database error", profileId: null },
      { status: 500 }
    )
  }

  return NextResponse.json({
    profileId: data?.id ?? null,
  })
}
