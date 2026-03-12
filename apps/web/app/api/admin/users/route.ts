import { NextRequest, NextResponse } from "next/server"
import { authenticateFunnelAdmin } from "@/lib/auth/funnel-admin"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const auth = await authenticateFunnelAdmin(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  if (auth.isApiKey) {
    return NextResponse.json(
      { error: "Session authentication required for user management" },
      { status: 403 }
    )
  }

  // Use admin client to list all profiles (bypasses RLS)
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, full_name, role, created_at, last_sign_in_at")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ users: data ?? [] })
}
