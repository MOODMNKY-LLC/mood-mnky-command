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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth()
  if (authError) return authError
  const { id } = await params
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing variable id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }
  try {
    const res = await flowiseFetch(`variables/${id}`)
    const text = await res.text()
    if (!res.ok) return flowiseError(res, text)
    const data = text ? JSON.parse(text) : {}
    return Response.json(data)
  } catch (err) {
    return flowiseError(new Response(null, { status: 502 }), "", err)
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth()
  if (authError) return authError
  const { id } = await params
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing variable id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }
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
    const res = await flowiseFetch(`variables/${id}`, { method: "PUT", body })
    const text = await res.text()
    if (!res.ok) return flowiseError(res, text)
    const data = text ? JSON.parse(text) : {}
    return Response.json(data)
  } catch (err) {
    return flowiseError(new Response(null, { status: 502 }), "", err)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth()
  if (authError) return authError
  const { id } = await params
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing variable id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }
  try {
    const res = await flowiseFetch(`variables/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const text = await res.text()
      return flowiseError(res, text)
    }
    return new Response(JSON.stringify({ deleted: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    return flowiseError(new Response(null, { status: 502 }), "", err)
  }
}
