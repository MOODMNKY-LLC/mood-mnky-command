import { flowiseFetch } from "@/lib/flowise/client"
import { checkFlowiseHealth } from "@/lib/flowise/health"
import type { ServiceStatusResult } from "./types"

const BASE_URL = process.env.FLOWISE_BASE_URL?.replace(/\/$/, "")
const API_KEY = process.env.FLOWISE_API_KEY

export function isFlowiseServiceConfigured(): boolean {
  return Boolean(BASE_URL && API_KEY)
}

export async function getFlowiseServiceStatus(): Promise<ServiceStatusResult> {
  if (!BASE_URL || !API_KEY) {
    return { error: "FLOWISE_BASE_URL or FLOWISE_API_KEY not set" }
  }
  try {
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
    return {
      status: "operational",
      metrics: { chatflowCount: count },
    }
  } catch (err) {
    return {
      status: "unavailable",
      error: err instanceof Error ? err.message : "Request failed",
    }
  }
}
