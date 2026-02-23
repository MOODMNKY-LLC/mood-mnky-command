import type { ServiceStatusResult } from "./types"

const BASE_URL = process.env.PALWORLD_SERVER_URL?.replace(/\/$/, "")
const API_USER = process.env.PALWORLD_API_USER || "admin"
const API_PASSWORD = process.env.PALWORLD_API_PASSWORD

export function isPalworldConfigured(): boolean {
  return Boolean(BASE_URL && API_PASSWORD)
}

/**
 * Palworld dedicated server REST API (RESTAPIEnabled=True, RESTAPIPort default 8212).
 * Uses HTTP Basic Auth; AdminPassword from server config as API_PASSWORD.
 * GET /info → version, servername, description; GET /players → player list for count.
 */
export async function getPalworldStatus(): Promise<ServiceStatusResult> {
  if (!BASE_URL || !API_PASSWORD) {
    return { error: "PALWORLD_SERVER_URL or PALWORLD_API_PASSWORD not set" }
  }
  try {
    const basicAuth = Buffer.from(`${API_USER}:${API_PASSWORD}`).toString("base64")
    const headers: Record<string, string> = {
      Authorization: `Basic ${basicAuth}`,
      Accept: "application/json",
    }
    const [infoRes, playersRes] = await Promise.all([
      fetch(`${BASE_URL}/info`, {
        headers,
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`${BASE_URL}/players`, {
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
