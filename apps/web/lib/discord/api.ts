/**
 * Server-only Discord API helpers. Uses DISCORD_BOT_TOKEN_MNKY_VERSE.
 * Never expose the token to the client.
 */

const DISCORD_API_BASE = "https://discord.com/api/v10"

export interface DiscordFetchOptions extends RequestInit {
  /** Sent as X-Audit-Log-Reason (URL-encoded) for write operations */
  auditLogReason?: string
}

function getBotToken(): string | undefined {
  return process.env.DISCORD_BOT_TOKEN_MNKY_VERSE
}

export function isDiscordConfigured(): boolean {
  return Boolean(getBotToken())
}

export async function discordFetch(
  path: string,
  options: DiscordFetchOptions = {}
): Promise<Response> {
  const token = getBotToken()
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Discord bot token not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    )
  }

  const url = path.startsWith("http") ? path : `${DISCORD_API_BASE}${path}`
  const headers = new Headers(options.headers)
  headers.set("Authorization", `Bot ${token}`)
  if (options.auditLogReason) {
    headers.set("X-Audit-Log-Reason", encodeURIComponent(options.auditLogReason.slice(0, 512)))
  }
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json")
  }

  const { auditLogReason: _, ...rest } = options
  return fetch(url, { ...rest, headers })
}

/** Result type when Discord returns 429 (rate limit) */
export interface DiscordRateLimitError {
  retryAfter: number
  message: string
}

export async function discordJson<T>(
  path: string,
  options: DiscordFetchOptions = {}
): Promise<T> {
  const res = await discordFetch(path, options)
  if (res.status === 429) {
    const data = await res.json().catch(() => ({})) as { retry_after?: number }
    const retryAfter = data.retry_after ?? Number(res.headers.get("Retry-After") ?? 1)
    throw new Error(
      JSON.stringify({ retryAfter, message: `Discord rate limit. Retry after ${retryAfter}s` })
    )
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Discord API ${res.status}: ${text}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

/** Parse rate limit error from discordJson throw */
export function parseRateLimitError(e: unknown): DiscordRateLimitError | null {
  if (e instanceof Error && e.message.startsWith("{")) {
    try {
      const o = JSON.parse(e.message) as { retryAfter?: number; message?: string }
      if (typeof o.retryAfter === "number") return { retryAfter: o.retryAfter, message: o.message ?? "Rate limited" }
    } catch {
      // ignore
    }
  }
  return null
}

/** Guild (server) the bot is in */
export interface DiscordGuild {
  id: string
  name: string
  icon: string | null
  owner: boolean
  permissions: string
}

/** Channel in a guild */
export interface DiscordChannel {
  id: string
  name: string
  type: number
  parent_id: string | null
  position: number
}
