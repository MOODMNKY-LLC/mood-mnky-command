import { createClient } from "@/lib/supabase/server"
import { getLabzConfig } from "@/lib/chat/labz-config"
import { isLabzAllowedModelOrPrefix, LABZ_TOOL_KEYS } from "@/lib/chat/labz-constants"

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
  const config = await getLabzConfig()
  return Response.json(config)
}

export async function PATCH(request: Request) {
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

  let body: { default_model?: string; system_prompt_override?: string | null; tool_overrides?: Record<string, boolean> | null }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const updates: { key: string; value: string }[] = []

  if (body.default_model !== undefined) {
    const model = typeof body.default_model === "string" ? body.default_model.trim() : ""
    if (model && !isLabzAllowedModelOrPrefix(model)) {
      return new Response(
        JSON.stringify({ error: "default_model must be an allowed model or versioned id" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }
    updates.push({ key: "default_model", value: model || "" })
  }

  if (body.system_prompt_override !== undefined) {
    const value = body.system_prompt_override == null ? "" : String(body.system_prompt_override)
    updates.push({ key: "system_prompt_override", value })
  }

  if (body.tool_overrides !== undefined) {
    const raw = body.tool_overrides
    let value = "{}"
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const filtered: Record<string, boolean> = {}
      for (const k of LABZ_TOOL_KEYS) {
        if (typeof raw[k] === "boolean") filtered[k] = raw[k]
      }
      value = JSON.stringify(filtered)
    }
    updates.push({ key: "tool_overrides", value })
  }

  for (const { key, value } of updates) {
    const { error } = await supabase
      .from("code_mnky_config")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
    if (error) {
      console.error("[PATCH /api/labz/config] Supabase upsert error:", error)
      return new Response(
        JSON.stringify({ error: error.message, code: error.code, details: error.details }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      )
    }
  }

  try {
    const config = await getLabzConfig()
    return Response.json(config)
  } catch (e) {
    console.error("[PATCH /api/labz/config] getLabzConfig error:", e)
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Failed to load config" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
