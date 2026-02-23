import type { ServiceStatusResult } from "./types"

const BASE_URL = process.env.TRUENAS_BASE_URL?.replace(/\/$/, "")
const API_KEY = process.env.TRUENAS_API_KEY

export function isTrueNasConfigured(): boolean {
  return Boolean(BASE_URL && API_KEY)
}

/**
 * TrueNAS SCALE: newer versions use JSON-RPC over WebSocket; REST was deprecated.
 * We try REST /api/v2.0/system/info for older SCALE.
 */
export async function getTrueNasStatus(): Promise<ServiceStatusResult> {
  if (!BASE_URL || !API_KEY) {
    return { error: "TRUENAS_BASE_URL or TRUENAS_API_KEY not set" }
  }
  try {
    const res = await fetch(`${BASE_URL}/api/v2.0/system/info`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
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
