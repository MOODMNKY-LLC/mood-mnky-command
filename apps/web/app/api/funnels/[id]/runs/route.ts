import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST: Start a new funnel run for the current user.
 * Returns run_id for embedding in JotForm (hidden field).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: funnelId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: funnel, error: fetchError } = await supabase
    .from("funnel_definitions")
    .select("id")
    .eq("id", funnelId)
    .eq("status", "active")
    .single()

  if (fetchError || !funnel) {
    return NextResponse.json({ error: "Funnel not found or inactive" }, { status: 404 })
  }

  const { data: run, error } = await supabase
    .from("funnel_runs")
    .insert({
      funnel_id: funnel.id,
      user_id: user.id,
      status: "started",
      context: {},
    })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    runId: run!.id,
    userId: user.id,
  })
}
