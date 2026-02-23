import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { SteamProfileCache } from "@/lib/steam"

export type SteamProfileResponse = {
  steamid64: string | null
  steam_linked_at: string | null
  steam_profile_cache: SteamProfileCache | null
}

/**
 * GET /api/me/steam
 * Returns the current user's Steam link and cached profile (no live Steam API call).
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("steamid64, steam_linked_at, steam_profile_cache")
    .eq("id", user.id)
    .single()

  if (error) {
    return NextResponse.json(
      { error: "Failed to load Steam profile", steamid64: null, steam_linked_at: null, steam_profile_cache: null },
      { status: 200 }
    )
  }

  const response: SteamProfileResponse = {
    steamid64: profile?.steamid64 ?? null,
    steam_linked_at: profile?.steam_linked_at ?? null,
    steam_profile_cache: (profile?.steam_profile_cache as SteamProfileCache | null) ?? null,
  }

  return NextResponse.json(response)
}
