import { createClient } from "@/lib/supabase/server"
import { flowiseFetch } from "@/lib/flowise/client"

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

function flowiseError(res: Response, text: string, err?: unknown) {
  const status = res.status >= 500 ? 502 : res.status
  return new Response(
    JSON.stringify({
      error: "Flowise request failed",
      status: res.status,
      detail: text?.slice(0, 500) ?? (err instanceof Error ? err.message : "Unknown error"),
    }),
    { status, headers: { "Content-Type": "application/json" } },
  )
}

export async function POST(request: Request) {
  const authError = await requireAuth()
  if (authError) return authError
  const contentType = request.headers.get("content-type") ?? ""
  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const file = formData.get("file") as File | null
      if (!file) {
        return new Response(JSON.stringify({ error: "Missing file in form" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      }
      const blob = await file.arrayBuffer()
      const flowiseFormData = new FormData()
      flowiseFormData.append("file", new Blob([blob], { type: file.type }), file.name || "chatflow.json")
      const { getFlowiseAuthHeaders } = await import("@/lib/flowise/client")
      const baseUrl = process.env.FLOWISE_BASE_URL ?? "https://flowise-dev.moodmnky.com"
      const url = `${baseUrl.replace(/\/$/, "")}/api/v1/chatflows/import`
      const res = await fetch(url, {
        method: "POST",
        headers: getFlowiseAuthHeaders(),
        body: flowiseFormData,
      })
      const text = await res.text()
      if (!res.ok) return flowiseError(res, text)
      const data = text ? JSON.parse(text) : {}
      return Response.json(data)
    }
    const body = await request.json()
    const res = await flowiseFetch("chatflows/import", { method: "POST", body })
    const text = await res.text()
    if (!res.ok) return flowiseError(res, text)
    const data = text ? JSON.parse(text) : {}
    return Response.json(data)
  } catch (err) {
    return flowiseError(new Response(null, { status: 502 }), "", err)
  }
}
