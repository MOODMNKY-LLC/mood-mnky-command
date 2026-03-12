/**
 * GET /api/flowise/assignments
 * Returns the current user's Flowise chatflow assignments (for Dojo profile default chatflow and chat switcher).
 */
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export type FlowiseAssignmentItem = {
  id: string
  profile_id: string
  chatflow_id: string
  display_name: string | null
  override_config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("flowise_chatflow_assignments")
    .select("id, profile_id, chatflow_id, display_name, override_config, created_at, updated_at")
    .eq("profile_id", user.id)
    .order("updated_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    assignments: (data ?? []) as FlowiseAssignmentItem[],
  })
}
