import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * PATCH /api/me/default-chatflow
 * Set the current user's default Flowise chatflow (must be one of their assignments).
 * Body: { chatflowId: string | null }
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { chatflowId?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const value = body.chatflowId === null || body.chatflowId === "" ? null : (body.chatflowId as string)?.trim()

  if (value !== null) {
    if (!value) {
      return NextResponse.json({ error: "chatflowId must be a non-empty string or null" }, { status: 400 })
    }
    const { data: assignment } = await supabase
      .from("flowise_chatflow_assignments")
      .select("id")
      .eq("profile_id", user.id)
      .eq("chatflow_id", value)
      .maybeSingle()
    if (!assignment) {
      return NextResponse.json(
        { error: "Chatflow is not assigned to you. Only assigned chatflows can be set as default." },
        { status: 403 }
      )
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ default_chatflow_id: value })
    .eq("id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ default_chatflow_id: value })
}
