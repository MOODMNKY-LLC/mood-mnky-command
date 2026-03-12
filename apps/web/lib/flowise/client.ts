import { FlowiseClient } from "flowise-sdk"

const BASE_URL =
  (process.env.FLOWISE_BASE_URL ?? "https://flowise-dev.moodmnky.com").replace(/\/$/, "")

/**
 * Server-only. FlowiseClient for createPrediction.
 * @param userApiKey - Optional per-user API key (decrypted); when set, used instead of FLOWISE_API_KEY.
 */
export function getFlowiseClient(userApiKey?: string | null): FlowiseClient {
  const apiKey = userApiKey ?? process.env.FLOWISE_API_KEY ?? ""
  return new FlowiseClient({ baseUrl: BASE_URL, apiKey })
}

/**
 * Server-only. Auth headers for Flowise API (e.g. GET chatflows). Never expose to client.
 * @param userApiKey - Optional per-user API key; when set, used instead of FLOWISE_API_KEY.
 */
export function getFlowiseAuthHeaders(userApiKey?: string | null): Record<string, string> {
  const key = userApiKey ?? process.env.FLOWISE_API_KEY
  if (!key) return {}
  return { Authorization: `Bearer ${key}` }
}

export function getFlowiseBaseUrl(): string {
  return BASE_URL
}

const FLOWISE_V1 = `${BASE_URL}/api/v1`

/** Message shown when Flowise returns HTML (wrong URL or proxy). */
export const FLOWISE_HTML_ERROR_DETAIL =
  "Flowise returned HTML instead of JSON. Set FLOWISE_BASE_URL to the Flowise instance root only (e.g. https://flowise-dev.moodmnky.com), with no path. Restart the dev server after changing .env."

/**
 * True if the response body looks like HTML (wrong URL or proxy error page).
 */
export function isHtmlResponse(text: string): boolean {
  const t = text.trim().toLowerCase()
  return t.startsWith("<!") || t.startsWith("<html")
}

/**
 * Server-only. Fetch Flowise API with auth. path is e.g. "chatflows" or "chatflows/123".
 * @param path - Path segment (e.g. "chatflows") or full URL.
 * @param init - Request init; body will be JSON-stringified if object.
 * @param userApiKey - Optional per-user API key for Bearer auth.
 */
export async function flowiseFetch(
  path: string,
  init: RequestInit & { body?: unknown } = {},
  userApiKey?: string | null,
): Promise<Response> {
  const { body, ...rest } = init
  const url = path.startsWith("http") ? path : `${FLOWISE_V1}/${path.replace(/^\//, "")}`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getFlowiseAuthHeaders(userApiKey),
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
