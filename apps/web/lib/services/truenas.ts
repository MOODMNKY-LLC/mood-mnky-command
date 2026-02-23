import type { ServiceStatusResult } from "./types"

export interface TrueNasConfig {
  baseUrl: string
  apiKey: string
}

function getEnvConfig(): TrueNasConfig | null {
  const baseUrl = process.env.TRUENAS_BASE_URL?.replace(/\/$/, "")
  const apiKey = process.env.TRUENAS_API_KEY
  return baseUrl && apiKey ? { baseUrl, apiKey } : null
}

export function isTrueNasConfigured(): boolean {
  return getEnvConfig() != null
}

/**
 * TrueNAS SCALE: newer versions use JSON-RPC over WebSocket; REST was deprecated.
 * We try REST /api/v2.0/system/info for older SCALE.
 */
export async function getTrueNasStatus(
  config?: TrueNasConfig | null,
): Promise<ServiceStatusResult> {
  const c = config ?? getEnvConfig()
  if (!c?.baseUrl || !c.apiKey) {
    return { error: "TRUENAS_BASE_URL or TRUENAS_API_KEY not set" }
  }
  try {
    const base = c.baseUrl.replace(/\/$/, "")
    const res = await fetch(`${base}/api/v2.0/system/info`, {
      headers: { Authorization: `Bearer ${c.apiKey}` },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      if (res.status === 404 || res.status === 401) {
        return {
          status: "unavailable",
          error: "TrueNAS API v2 not available or invalid key. SCALE 25+ may require JSON-RPC.",
        }
      }
      return { status: "unavailable", error: `API ${res.status}` }
    }
    const data = (await res.json()) as { hostname?: string; version?: string }
    return {
      status: "operational",
      metrics: {
        hostname: data.hostname ?? "TrueNAS",
        version: data.version ?? "—",
      },
    }
  } catch (err) {
    return {
      status: "unavailable",
      error: err instanceof Error ? err.message : "Request failed",
    }
  }
}
