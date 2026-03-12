import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getSignedUrl } from "@/lib/minio/s3-client"

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single()
  const isAdmin = profile?.role === "admin" || profile?.is_admin === true
  return isAdmin ? user : null
}

/** POST: Get signed URL. Body: { key: string, expiresIn?: number } */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bucket: string }> }
) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { bucket } = await params
  if (!bucket) {
    return NextResponse.json({ error: "Missing bucket" }, { status: 400 })
  }

  let body: { key?: string; expiresIn?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const key = body?.key?.trim()
  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 })
  }

  const expiresIn = typeof body.expiresIn === "number" ? body.expiresIn : 3600
  const result = await getSignedUrl(bucket, key, expiresIn)

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: 500 }
    )
  }
  return NextResponse.json({ url: result.url })
}
