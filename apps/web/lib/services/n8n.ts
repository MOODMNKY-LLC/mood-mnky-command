import type { ServiceStatusResult } from "./types"

export interface N8nConfig {
  baseUrl: string
  apiKey: string
}

function getEnvConfig(): N8nConfig | null {
  const baseUrl = process.env.N8N_API_URL?.replace(/\/$/, "")
  const apiKey = process.env.N8N_API_KEY
  return baseUrl && apiKey ? { baseUrl, apiKey } : null
}

export function isN8nConfigured(): boolean {
  return getEnvConfig() != null
}

export async function getN8nStatus(config?: N8nConfig | null): Promise<ServiceStatusResult> {
  const c = config ?? getEnvConfig()
  if (!c?.baseUrl || !c.apiKey) {
    return { error: "N8N_API_URL or N8N_API_KEY not set" }
  }
  try {
    const base = c.baseUrl.replace(/\/$/, "")
    const res = await fetch(`${base}/api/v1/workflows`, {
      headers: { "X-N8N-API-KEY": c.apiKey },
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
