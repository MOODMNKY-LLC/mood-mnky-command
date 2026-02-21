/**
 * Flowise health check for fallback logic.
 * Used by Dojo chatbot to detect when Flowise is unavailable and offer OpenAI fallback.
 */

import { getFlowiseBaseUrl, getFlowiseAuthHeaders } from "./client"
import { cacheGet, cacheSet } from "@/lib/redis"

export interface FlowiseHealthResult {
  ok: boolean
  error?: string
  status?: number
}

const FLOWISE_HEALTH_CACHE_KEY = "flowise:health"
const FLOWISE_HEALTH_CACHE_TTL_SEC = 30

/**
 * Pings Flowise instance and returns health status.
 * Result is cached for 30s (Redis when configured) to avoid repeated pings.
 * Server-only. Use in API routes or server components.
 */
export async function checkFlowiseHealth(): Promise<FlowiseHealthResult> {
  const cached = await cacheGet<FlowiseHealthResult>(FLOWISE_HEALTH_CACHE_KEY)
  if (cached !== null) return cached

  const baseUrl = getFlowiseBaseUrl()
  if (!baseUrl) {
    return { ok: false, error: "FLOWISE_BASE_URL not configured" }
  }

  const headers = getFlowiseAuthHeaders()

  try {
    const res = await fetch(`${baseUrl}/api/v1/ping`, {
      headers,
      signal: AbortSignal.timeout(5000),
    })
    const result: FlowiseHealthResult = res.ok
      ? { ok: true }
      : { ok: false, error: "Flowise instance not reachable", status: res.status }
    await cacheSet(FLOWISE_HEALTH_CACHE_KEY, result, FLOWISE_HEALTH_CACHE_TTL_SEC)
    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    const result = { ok: false, error: message }
    await cacheSet(FLOWISE_HEALTH_CACHE_KEY, result, FLOWISE_HEALTH_CACHE_TTL_SEC)
    return result
  }
}
