import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient, getSupabaseConfigMissing } from "@/lib/supabase/admin"

/**
 * DELETE: Remove a gallery entry. Admin only.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single()
  const isAdmin = profile?.role === "admin" || profile?.is_admin === true
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (getSupabaseConfigMissing()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
  }
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 })
  }
  const { error } = await admin.from("main_media_gallery").delete().eq("id", id)
  if (error) {
    console.error("Main media gallery delete error:", error)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
