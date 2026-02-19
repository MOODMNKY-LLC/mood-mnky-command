import { createClient } from "@/lib/supabase/server"
import { getFlowiseBaseUrl, getFlowiseAuthHeaders } from "@/lib/flowise/client"

export async function GET() {
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

  const baseUrl = getFlowiseBaseUrl()
  const headers = getFlowiseAuthHeaders()

  try {
    const res = await fetch(`${baseUrl}/api/v1/ping`, { headers })
    if (!res.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: "Flowise instance not reachable", status: res.status }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      )
    }
    const text = await res.text()
    return new Response(JSON.stringify({ ok: true, message: text || "pong" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    )
  }
}
