import { createClient } from "@/lib/supabase/server"
import {
  flowiseFetch,
  FLOWISE_HTML_ERROR_DETAIL,
  isHtmlResponse,
} from "@/lib/flowise/client"

async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }
  return null
}

/**
 * GET /api/flowise/chatflows - Proxies Flowise GET /api/v1/chatflows.
 * On failure returns 200 with { error, detail } so the UI can show the real failure reason.
 */
export async function GET() {
  const authError = await requireAuth()
  if (authError) return authError
  try {
    const res = await flowiseFetch("chatflows")
    const text = await res.text()
    if (isHtmlResponse(text)) {
      return Response.json({
        error: "Flowise request failed",
        detail: FLOWISE_HTML_ERROR_DETAIL,
      })
    }
    if (!res.ok) {
      const detail = text?.slice(0, 500) || `Flowise returned ${res.status}`
      return Response.json({ error: "Flowise request failed", status: res.status, detail })
    }
    const data = text ? JSON.parse(text) : []
    return Response.json(Array.isArray(data) ? data : [])
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return Response.json({ error: "Flowise request failed", detail: message })
  }
}

export async function POST(request: Request) {
  const authError = await requireAuth()
  if (authError) return authError
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }
  try {
    const res = await flowiseFetch("chatflows", { method: "POST", body })
    const text = await res.text()
    if (isHtmlResponse(text)) {
      return Response.json({
        error: "Flowise request failed",
        detail: FLOWISE_HTML_ERROR_DETAIL,
      })
    }
    if (!res.ok) {
      const detail = text?.slice(0, 500) || `Flowise returned ${res.status}`
      return Response.json({ error: "Flowise request failed", status: res.status, detail })
    }
    const data = text ? JSON.parse(text) : {}
    return Response.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return Response.json({ error: "Flowise request failed", detail: message })
  }
}
