import type { ServiceStatusResult } from "./types"

export interface PalworldConfig {
  baseUrl: string
  apiUser: string
  apiPassword: string
}

function getEnvConfig(): PalworldConfig | null {
  const baseUrl = process.env.PALWORLD_SERVER_URL?.replace(/\/$/, "")
  const apiUser = process.env.PALWORLD_API_USER || "admin"
  const apiPassword = process.env.PALWORLD_API_PASSWORD
  return baseUrl && apiPassword ? { baseUrl, apiUser, apiPassword } : null
}

export function isPalworldConfigured(): boolean {
  return getEnvConfig() != null
}

/**
 * Palworld dedicated server REST API (RESTAPIEnabled=True, RESTAPIPort default 8212).
 * Uses HTTP Basic Auth; AdminPassword from server config as API_PASSWORD.
 * GET /info → version, servername, description; GET /players → player list for count.
 */
export async function getPalworldStatus(
  config?: PalworldConfig | null,
): Promise<ServiceStatusResult> {
  const c = config ?? getEnvConfig()
  if (!c?.baseUrl || !c.apiPassword) {
    return { error: "PALWORLD_SERVER_URL or PALWORLD_API_PASSWORD not set" }
  }
  try {
    const base = c.baseUrl.replace(/\/$/, "")
    const basicAuth = Buffer.from(`${c.apiUser}:${c.apiPassword}`).toString("base64")
    const headers: Record<string, string> = {
      Authorization: `Basic ${basicAuth}`,
      Accept: "application/json",
    }
    const [infoRes, playersRes] = await Promise.all([
      fetch(`${base}/info`, {
        headers,
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`${base}/players`, {
        headers,
        signal: AbortSignal.timeout(8000),
      }),
    ])
    if (!infoRes.ok) {
      if (infoRes.status === 401) {
        return { status: "unavailable", error: "Invalid API credentials (check AdminPassword)" }
      }
      return { status: "unavailable", error: `Info API ${infoRes.status}` }
    }
    const info = (await infoRes.json()) as {
      version?: string
      servername?: string
      description?: string
    }
    let playerCount = 0
    if (playersRes.ok && playersRes.headers.get("content-type")?.includes("json")) {
      const players = (await playersRes.json()) as unknown[]
      playerCount = Array.isArray(players) ? players.length : 0
    }
    return {
      status: "operational",
      metrics: {
        serverName: info.servername ?? "Palworld",
        version: info.version ?? "—",
        playerCount,
      },
    }
  } catch (err) {
    return {
      status: "unavailable",
      error: err instanceof Error ? err.message : "Request failed",
    }
  }
}
