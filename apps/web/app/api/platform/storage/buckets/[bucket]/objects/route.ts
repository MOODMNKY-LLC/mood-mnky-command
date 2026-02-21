import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  listObjects,
  uploadObject,
  deleteObjects,
} from "@/lib/minio/s3-client"

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024 // 50 MB

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

/** GET: List objects. Query: ?prefix= */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bucket: string }> }
) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { bucket } = await params
  if (!bucket) {
    return NextResponse.json({ error: "Missing bucket" }, { status: 400 })
  }

  const url = new URL(_request.url)
  const prefix = url.searchParams.get("prefix") ?? undefined

  const result = await listObjects(bucket, prefix)
  return NextResponse.json(result)
}

/** POST: Upload object. multipart/form-data: file, key (optional path) */
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

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file") instanceof File ? (formData.get("file") as File) : null
  const keyOverride = formData.get("key")?.toString()?.trim()

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Missing or empty file" }, { status: 400 })
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `File too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB)` },
      { status: 400 }
    )
  }

  const key = keyOverride || file.name
  const body = await file.arrayBuffer()
  const result = await uploadObject(
    bucket,
    key,
    new Uint8Array(body),
    file.type || undefined
  )

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Upload failed" },
      { status: 500 }
    )
  }
  return NextResponse.json({ ok: true, key })
}

/** DELETE: Delete objects. Body: { keys: string[] } */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bucket: string }> }
) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { bucket } = await params
  if (!bucket) {
    return NextResponse.json({ error: "Missing bucket" }, { status: 400 })
  }

  let body: { keys?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const keys = Array.isArray(body?.keys) ? body.keys.filter((k): k is string => typeof k === "string") : []
  if (keys.length === 0) {
    return NextResponse.json({ error: "Missing keys array" }, { status: 400 })
  }

  const result = await deleteObjects(bucket, keys)
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Delete failed" },
      { status: 500 }
    )
  }
  return NextResponse.json({ ok: true, deleted: result.deleted })
}
