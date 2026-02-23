import type { ServiceStatusResult } from "./types"

export interface JellyfinConfig {
  baseUrl: string
  apiKey: string
}

function getEnvConfig(): JellyfinConfig | null {
  const baseUrl = process.env.JELLYFIN_BASE_URL?.replace(/\/$/, "")
  const apiKey = process.env.JELLYFIN_API_KEY
  return baseUrl && apiKey ? { baseUrl, apiKey } : null
}

export function isJellyfinConfigured(): boolean {
  return getEnvConfig() != null
}

export async function getJellyfinStatus(
  config?: JellyfinConfig | null,
): Promise<ServiceStatusResult> {
  const c = config ?? getEnvConfig()
  if (!c?.baseUrl || !c.apiKey) {
    return { error: "JELLYFIN_BASE_URL or JELLYFIN_API_KEY not set" }
  }
  try {
    const authHeader = `MediaBrowser Client="MOOD MNKY", Device="Server", DeviceId="mood-mnky-labz", Version="1.0", Token="${c.apiKey}"`
    const base = c.baseUrl.replace(/\/$/, "")
    const [systemRes, usersRes, healthRes] = await Promise.all([
      fetch(`${base}/System/Info`, {
        headers: { "X-Emby-Authorization": authHeader },
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`${base}/Users`, {
        headers: { "X-Emby-Authorization": authHeader },
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`${base}/health`, { signal: AbortSignal.timeout(5000) }),
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
