/**
 * Server-only n8n API client for workflows and executions.
 * Config from getConfigForService('mnky-auto') (env or deployed_services).
 */

import { getConfigForService } from "@/lib/services"

export interface N8nConfig {
  baseUrl: string
  apiKey: string
}

export interface N8nWorkflow {
  id?: string
  name: string
  active?: boolean
  createdAt?: string
  updatedAt?: string
  nodes?: unknown[]
  connections?: Record<string, unknown>
  settings?: Record<string, unknown>
  staticData?: unknown
  tags?: Array<{ id: string; name: string }>
  [key: string]: unknown
}

export interface N8nWorkflowList {
  data: N8nWorkflow[]
  nextCursor?: string | null
}

export interface N8nExecution {
  id: string
  finished?: boolean
  mode?: string
  retryOf?: string | null
  retrySuccessId?: string | null
  startedAt: string
  stoppedAt?: string | null
  workflowId: string
  workflowData?: { name?: string }
  status?: string
  [key: string]: unknown
}

export interface N8nExecutionList {
  data: N8nExecution[]
  nextCursor?: string | null
}

class N8nApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: string
  ) {
    super(message)
    this.name = "N8nApiError"
  }
}

export async function getN8nConfig(): Promise<N8nConfig | null> {
  const raw = await getConfigForService("mnky-auto")
  if (!raw || typeof raw !== "object") return null
  const o = raw as { baseUrl?: string; apiKey?: string }
  const baseUrl = o.baseUrl?.replace?.(/\/$/, "") ?? ""
  const apiKey = o.apiKey ?? ""
  return baseUrl && apiKey ? { baseUrl, apiKey } : null
}

async function n8nFetch<T>(
  config: N8nConfig,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${config.baseUrl}/api/v1${path}`
  const headers = new Headers(options.headers)
  headers.set("X-N8N-API-KEY", config.apiKey)
  headers.set("Content-Type", "application/json")
  const res = await fetch(url, {
    ...options,
    headers,
    signal: AbortSignal.timeout(15000),
  })
  const text = await res.text()
  if (!res.ok) {
    throw new N8nApiError(
      `n8n API ${res.status}: ${res.statusText}`,
      res.status,
      text
    )
  }
  if (res.status === 204 || text.length === 0) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    throw new N8nApiError("Invalid JSON response", res.status, text)
  }
}

export interface ListWorkflowsParams {
  active?: boolean
  tags?: string
  name?: string
  limit?: number
  cursor?: string
  excludePinnedData?: boolean
}

export async function listWorkflows(
  config: N8nConfig,
  params?: ListWorkflowsParams
): Promise<N8nWorkflowList> {
  const sp = new URLSearchParams()
  if (params?.active !== undefined) sp.set("active", String(params.active))
  if (params?.tags) sp.set("tags", params.tags)
  if (params?.name) sp.set("name", params.name)
  if (params?.limit != null) sp.set("limit", String(params.limit))
  if (params?.cursor) sp.set("cursor", params.cursor)
  if (params?.excludePinnedData === true) sp.set("excludePinnedData", "true")
  const q = sp.toString()
  const path = q ? `/workflows?${q}` : "/workflows"
  return n8nFetch<N8nWorkflowList>(config, path)
}

export async function getWorkflow(
  config: N8nConfig,
  id: string,
  excludePinnedData = true
): Promise<N8nWorkflow> {
  const path = `/workflows/${encodeURIComponent(id)}${excludePinnedData ? "?excludePinnedData=true" : ""}`
  return n8nFetch<N8nWorkflow>(config, path)
}

export async function createWorkflow(
  config: N8nConfig,
  body: N8nWorkflow
): Promise<N8nWorkflow> {
  return n8nFetch<N8nWorkflow>(config, "/workflows", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function updateWorkflow(
  config: N8nConfig,
  id: string,
  body: N8nWorkflow
): Promise<N8nWorkflow> {
  return n8nFetch<N8nWorkflow>(config, `/workflows/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  })
}

export async function deleteWorkflow(
  config: N8nConfig,
  id: string
): Promise<N8nWorkflow> {
  return n8nFetch<N8nWorkflow>(config, `/workflows/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}

export async function activateWorkflow(
  config: N8nConfig,
  id: string
): Promise<N8nWorkflow> {
  return n8nFetch<N8nWorkflow>(
    config,
    `/workflows/${encodeURIComponent(id)}/activate`,
    { method: "POST" }
  )
}

export async function deactivateWorkflow(
  config: N8nConfig,
  id: string
): Promise<N8nWorkflow> {
  return n8nFetch<N8nWorkflow>(
    config,
    `/workflows/${encodeURIComponent(id)}/deactivate`,
    { method: "POST" }
  )
}

export interface ListExecutionsParams {
  workflowId?: string
  status?: "error" | "success" | "waiting"
  limit?: number
  cursor?: string
  includeData?: boolean
}

export async function listExecutions(
  config: N8nConfig,
  params?: ListExecutionsParams
): Promise<N8nExecutionList> {
  const sp = new URLSearchParams()
  if (params?.workflowId) sp.set("workflowId", params.workflowId)
  if (params?.status) sp.set("status", params.status)
  if (params?.limit != null) sp.set("limit", String(params.limit))
  if (params?.cursor) sp.set("cursor", params.cursor)
  if (params?.includeData === true) sp.set("includeData", "true")
  const q = sp.toString()
  const path = q ? `/executions?${q}` : "/executions"
  return n8nFetch<N8nExecutionList>(config, path)
}

export async function getExecution(
  config: N8nConfig,
  id: string,
  includeData = false
): Promise<N8nExecution> {
  const path = `/executions/${encodeURIComponent(id)}${includeData ? "?includeData=true" : ""}`
  return n8nFetch<N8nExecution>(config, path)
}

export { N8nApiError }
