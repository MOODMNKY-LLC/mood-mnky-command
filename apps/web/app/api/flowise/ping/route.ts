import { createClient } from "@/lib/supabase/server"
import { checkFlowiseHealth } from "@/lib/flowise/health"

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

  const result = await checkFlowiseHealth()
  if (!result.ok) {
    return new Response(
      JSON.stringify({ ok: false, error: result.error ?? "Flowise unavailable", status: result.status }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    )
  }
  return new Response(JSON.stringify({ ok: true, message: "pong" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
