import { flowiseFetch } from "@/lib/flowise/client"
import { checkFlowiseHealth } from "@/lib/flowise/health"
import type { ServiceStatusResult } from "./types"

export interface FlowiseConfig {
  baseUrl: string
  apiKey: string
}

function getEnvConfig(): FlowiseConfig | null {
  const baseUrl = process.env.FLOWISE_BASE_URL?.replace(/\/$/, "")
  const apiKey = process.env.FLOWISE_API_KEY
  return baseUrl && apiKey ? { baseUrl, apiKey } : null
}

export function isFlowiseServiceConfigured(): boolean {
  return getEnvConfig() != null
}

export async function getFlowiseServiceStatus(
  config?: FlowiseConfig | null,
): Promise<ServiceStatusResult> {
  const c = config ?? getEnvConfig()
  if (!c?.baseUrl || !c.apiKey) {
    return { error: "FLOWISE_BASE_URL or FLOWISE_API_KEY not set" }
  }
  try {
    if (!config) {
      const health = await checkFlowiseHealth()
      if (!health.ok) {
        return {
          status: "unavailable",
          error: health.error ?? "Health check failed",
        }
      }
      const chatflowsRes = await flowiseFetch("chatflows", { method: "GET" })
      let count = 0
      if (chatflowsRes.ok && chatflowsRes.headers.get("content-type")?.includes("json")) {
        const data = (await chatflowsRes.json()) as unknown[]
        count = Array.isArray(data) ? data.length : 0
      }
      return { status: "operational", metrics: { chatflowCount: count } }
    }
    const base = c.baseUrl.replace(/\/$/, "")
    const pingRes = await fetch(`${base}/api/v1/ping`, {
      headers: { Authorization: `Bearer ${c.apiKey}` },
      signal: AbortSignal.timeout(5000),
    })
    if (!pingRes.ok) {
      return {
        status: "unavailable",
        error: pingRes.status === 401 ? "Invalid API key" : "Health check failed",
      }
    }
    const chatflowsRes = await fetch(`${base}/api/v1/chatflows`, {
      headers: {
        Authorization: `Bearer ${c.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    })
    let count = 0
    if (chatflowsRes.ok && chatflowsRes.headers.get("content-type")?.includes("json")) {
      const data = (await chatflowsRes.json()) as unknown[]
      count = Array.isArray(data) ? data.length : 0
    }
    return { status: "operational", metrics: { chatflowCount: count } }
  } catch (err) {
    return {
      status: "unavailable",
      error: err instanceof Error ? err.message : "Request failed",
    }
  }
}
