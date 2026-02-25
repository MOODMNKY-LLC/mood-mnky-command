/**
 * Resolve Discord user ID to web app profile ID (for event ingestion).
 * Calls GET /api/discord/profile-by-discord-id?discordUserId=...
 * Returns null on any failure (network, non-OK, or non-JSON) so the bot does not crash.
 */

import { createLogger, maskBaseUrl, truncate } from "./logger.js"

const log = createLogger("profile")

export async function getProfileIdByDiscordUserId(
  baseUrl: string,
  apiKey: string,
  discordUserId: string
): Promise<string | null> {
  const path = "/api/discord/profile-by-discord-id"
  const url = new URL(`${baseUrl.replace(/\/$/, "")}${path}`)
  url.searchParams.set("discordUserId", discordUserId)
  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const raw = await res.text()
    if (!res.ok) {
      log.warn("profile_resolve_failed", {
        url_host: maskBaseUrl(baseUrl),
        path,
        status: res.status,
        body_preview: truncate(raw, 200),
      })
      return null
    }
    const contentType = res.headers.get("content-type") ?? ""
    if (!contentType.includes("application/json")) {
      log.warn("profile_resolve_not_json", {
        url_host: maskBaseUrl(baseUrl),
        path,
        status: res.status,
        content_type: contentType.slice(0, 50),
      })
      return null
    }
    const data = JSON.parse(raw) as { profileId?: string | null }
    return data.profileId ?? null
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.warn("profile_resolve_error", {
      url_host: maskBaseUrl(baseUrl),
      path,
      error: msg,
    })
    return null
  }
}
