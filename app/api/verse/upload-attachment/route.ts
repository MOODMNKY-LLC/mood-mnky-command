import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  BUCKETS,
  getPublicUrl,
  uploadFile,
} from "@/lib/supabase/storage"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
]

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "file"
}

/**
 * Upload one or more files for Verse chat. Returns durable public URLs.
 * Auth: Supabase session required. Body: FormData with "files" (File[]) and optional "sessionId".
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    )
  }

  const sessionId =
    (formData.get("sessionId") as string) || "no-session"
  const files = formData.getAll("files") as File[]
  if (!files?.length) {
    return NextResponse.json(
      { error: "At least one file required (field: files)" },
      { status: 400 }
    )
  }

  const results: { url: string; filename: string; mediaType: string }[] = []

  for (const file of files) {
    if (!(file instanceof File)) continue
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File ${file.name} exceeds 10 MB limit` },
        { status: 400 }
      )
    }
    if (ALLOWED_TYPES.length && !ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed: ${file.type}` },
        { status: 400 }
      )
    }

    const safeName = sanitizeFilename(file.name)
    const uniqueId = crypto.randomUUID()
    const storageFileName = `${sessionId}/${uniqueId}-${safeName}`

    try {
      const { path } = await uploadFile(
        supabase,
        BUCKETS.chatAttachments,
        user.id,
        storageFileName,
        file,
        { contentType: file.type }
      )
      const publicUrl = getPublicUrl(
        supabase,
        BUCKETS.chatAttachments,
        path
      )
      results.push({
        url: publicUrl,
        filename: file.name,
        mediaType: file.type,
      })
    } catch (err) {
      console.error("Verse upload attachment error:", err)
      return NextResponse.json(
        { error: "Upload failed" },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ files: results })
}
