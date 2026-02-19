import { FlowiseClient } from "flowise-sdk"

const BASE_URL =
  (process.env.FLOWISE_BASE_URL ?? "https://flowise-dev.moodmnky.com").replace(/\/$/, "")

/**
 * Server-only. FlowiseClient for createPrediction. Use with getFlowiseAuthHeaders() for API key.
 */
export function getFlowiseClient(): FlowiseClient {
  const apiKey = process.env.FLOWISE_API_KEY ?? ""
  return new FlowiseClient({ baseUrl: BASE_URL, apiKey })
}

/**
 * Server-only. Auth headers for Flowise API (e.g. GET chatflows). Never expose to client.
 */
export function getFlowiseAuthHeaders(): Record<string, string> {
  const key = process.env.FLOWISE_API_KEY
  if (!key) return {}
  return { Authorization: `Bearer ${key}` }
}

export function getFlowiseBaseUrl(): string {
  return BASE_URL
}

const FLOWISE_V1 = `${BASE_URL}/api/v1`

/**
 * Server-only. Fetch Flowise API with auth. path is e.g. "chatflows" or "chatflows/123".
 */
export async function flowiseFetch(
  path: string,
  init: RequestInit & { body?: unknown } = {},
): Promise<Response> {
  const { body, ...rest } = init
  const url = path.startsWith("http") ? path : `${FLOWISE_V1}/${path.replace(/^\//, "")}`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getFlowiseAuthHeaders(),
    ...(typeof init.headers === "object" && init.headers !== null
      ? (init.headers as Record<string, string>)
      : {}),
  }
  return fetch(url, {
    ...rest,
    headers,
    body: body !== undefined ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  })
}
