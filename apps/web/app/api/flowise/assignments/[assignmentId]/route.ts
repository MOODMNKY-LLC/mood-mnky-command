/**
 * PATCH /api/flowise/assignments/[assignmentId]
 * Update override_config for the current user's assignment. Only allowed keys are persisted.
 */
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/** Allowed override_config keys for Dojo chat: one text field (systemMessage) + booleans only. */
const ALLOWED_OVERRIDE_KEYS = [
  "systemMessage",
  "returnSourceDocuments",
] as const

const BOOLEAN_KEYS = ["returnSourceDocuments"] as const

function filterOverrideConfig(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of ALLOWED_OVERRIDE_KEYS) {
    if (!(key in body)) continue
    const v = body[key]
    if (BOOLEAN_KEYS.includes(key as (typeof BOOLEAN_KEYS)[number])) {
      out[key] = Boolean(v)
    } else if (key === "systemMessage") {
      out[key] = typeof v === "string" ? v : ""
    }
  }
  return out
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { assignmentId } = await params
  if (!assignmentId) {
    return NextResponse.json({ error: "Missing assignmentId" }, { status: 400 })
  }

  let body: { override_config?: Record<string, unknown> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const allowedUpdates =
    body?.override_config != null && typeof body.override_config === "object"
      ? filterOverrideConfig(body.override_config as Record<string, unknown>)
      : {}

  const { data: existingRow } = await supabase
    .from("flowise_chatflow_assignments")
    .select("override_config")
    .eq("id", assignmentId)
    .eq("profile_id", user.id)
    .maybeSingle()

  const existingConfig = (existingRow?.override_config as Record<string, unknown> | null) ?? {}
  const overrideConfig = { ...existingConfig, ...allowedUpdates }

  const { data, error } = await supabase
    .from("flowise_chatflow_assignments")
    .update({
      override_config: overrideConfig,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assignmentId)
    .eq("profile_id", user.id)
    .select("id, override_config, updated_at")
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
  }

  return NextResponse.json(data)
}
