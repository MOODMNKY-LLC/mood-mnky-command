import type { ServiceStatusResult } from "./types"

const BASE_URL = process.env.N8N_API_URL?.replace(/\/$/, "")
const API_KEY = process.env.N8N_API_KEY

export function isN8nConfigured(): boolean {
  return Boolean(BASE_URL && API_KEY)
}

export async function getN8nStatus(): Promise<ServiceStatusResult> {
  if (!BASE_URL || !API_KEY) {
    return { error: "N8N_API_URL or N8N_API_KEY not set" }
  }
  try {
    const res = await fetch(`${BASE_URL}/api/v1/workflows`, {
      headers: { "X-N8N-API-KEY": API_KEY },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      return { status: "unavailable", error: `Workflows API ${res.status}` }
    }
    const data = (await res.json()) as { data?: unknown[] }
    const workflows = Array.isArray(data.data) ? data.data : []
    const active = workflows.filter(
      (w: { active?: boolean }) => w.active === true
    ).length
    return {
      status: "operational",
      metrics: {
        totalWorkflows: workflows.length,
        activeWorkflows: active,
      },
    }
  } catch (err) {
    return {
      status: "unavailable",
      error: err instanceof Error ? err.message : "Request failed",
    }
  }
}
