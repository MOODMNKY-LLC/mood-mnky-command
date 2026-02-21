import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { listBuckets, createBucket } from "@/lib/minio/s3-client"

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

/** GET: List buckets. Returns { buckets, error? } on permission failure. */
export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const result = await listBuckets()
  return NextResponse.json(result)
}

/** POST: Create bucket. Body: { name: string } */
export async function POST(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { name?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const name = body?.name?.trim()
  if (!name) {
    return NextResponse.json({ error: "Missing bucket name" }, { status: 400 })
  }

  const result = await createBucket(name)
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Failed to create bucket" },
      { status: 500 }
    )
  }
  return NextResponse.json({ ok: true })
}
