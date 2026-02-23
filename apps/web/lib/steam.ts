/**
 * Steam OpenID 2.0 and Web API helpers.
 * Used by /api/auth/steam/link, /api/auth/steam/callback, and profile cache.
 */

const STEAM_OPENID_LOGIN = "https://steamcommunity.com/openid/login"
const STEAM_WEB_API_BASE = "https://api.steampowered.com"

export type SteamProfileCache = {
  personaname: string
  avatar: string
  avatarfull: string
  personastate: number
  lastlogoff?: number
  profileurl?: string
}

/**
 * Build the Steam OpenID 2.0 redirect URL.
 * Use request.nextUrl.origin so callback works across www.moodmnky.com, mnky-command, mnky-verse.
 */
export function buildSteamOpenIdUrl(returnTo: string, realm: string): string {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  })
  return `${STEAM_OPENID_LOGIN}?${params.toString()}`
}

/**
 * Extract SteamID64 from Steam OpenID claimed_id.
 * Format: https://steamcommunity.com/openid/id/76561197960287930
 */
export function parseSteamId64FromClaimedId(claimedId: string | null): string | null {
  if (!claimedId || typeof claimedId !== "string") return null
  const prefix = "https://steamcommunity.com/openid/id/"
  if (!claimedId.startsWith(prefix)) return null
  const id = claimedId.slice(prefix.length).trim()
  return /^\d{17}$/.test(id) ? id : null
}

/**
 * Fetch player summary from Steam Web API and return a small snapshot for profiles.steam_profile_cache.
 * Call only on link (and optional refresh); do not call on every page load (rate limits).
 */
export async function fetchSteamProfile(steamid64: string): Promise<SteamProfileCache | null> {
  const apiKey = process.env.STEAM_WEB_API_KEY
  if (!apiKey) return null

  const url = new URL("/ISteamUser/GetPlayerSummaries/v2/", STEAM_WEB_API_BASE)
  url.searchParams.set("key", apiKey)
  url.searchParams.set("steamids", steamid64)

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) return null

  const data = (await res.json()) as {
    response?: { players?: Array<Record<string, unknown>> }
  }
  const players = data?.response?.players
  const player = Array.isArray(players) && players.length > 0 ? players[0] : null
  if (!player) return null

  return {
    personaname: String(player.personaname ?? ""),
    avatar: String(player.avatar ?? ""),
    avatarfull: String(player.avatarfull ?? ""),
    personastate: Number(player.personastate ?? 0),
    lastlogoff: player.lastlogoff != null ? Number(player.lastlogoff) : undefined,
    profileurl: player.profileurl != null ? String(player.profileurl) : undefined,
  }
}
