import type { ServiceStatusResult } from "./types"

const BASE_URL = process.env.JELLYFIN_BASE_URL?.replace(/\/$/, "")
const API_KEY = process.env.JELLYFIN_API_KEY

export function isJellyfinConfigured(): boolean {
  return Boolean(BASE_URL && API_KEY)
}

export async function getJellyfinStatus(): Promise<ServiceStatusResult> {
  if (!BASE_URL || !API_KEY) {
    return { error: "JELLYFIN_BASE_URL or JELLYFIN_API_KEY not set" }
  }
  try {
    const authHeader = `MediaBrowser Client="MOOD MNKY", Device="Server", DeviceId="mood-mnky-labz", Version="1.0", Token="${API_KEY}"`
    const [systemRes, usersRes, healthRes] = await Promise.all([
      fetch(`${BASE_URL}/System/Info`, {
        headers: { "X-Emby-Authorization": authHeader },
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`${BASE_URL}/Users`, {
        headers: { "X-Emby-Authorization": authHeader },
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(5000) }),
    ])

    if (!systemRes.ok) {
      return { status: "unavailable", error: `System/Info ${systemRes.status}` }
    }

    const healthOk = healthRes.ok
    const system = (await systemRes.json()) as { ServerName?: string }
    const users = usersRes.ok ? ((await usersRes.json()) as unknown[]) : []

    return {
      status: healthOk ? "operational" : "degraded",
      metrics: {
        serverName: system.ServerName ?? "Jellyfin",
        userCount: users.length,
      },
    }
  } catch (err) {
    return {
      status: "unavailable",
      error: err instanceof Error ? err.message : "Request failed",
    }
  }
}
