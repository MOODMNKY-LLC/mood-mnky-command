import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createVoiceConsent } from "@/lib/openai/audio"

export const maxDuration = 60

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MiB per OpenAI
const ALLOWED_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/aac",
  "audio/flac",
  "audio/webm",
  "audio/mp4",
]

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("voice_consents")
    .select("id, openai_consent_id, name, language, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("List voice consents error:", error)
    return NextResponse.json(
      { error: error.message ?? "Failed to list consents" },
      { status: 500 }
    )
  }

  return NextResponse.json({ consents: data ?? [] })
}

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
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const name = (formData.get("name") as string) || "Unnamed"
  const language = (formData.get("language") as string) || "en-US"
  const file = formData.get("recording") as File | null

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "recording file is required" },
      { status: 400 }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum 10 MB." },
      { status: 400 }
    )
  }

  const mime = (file.type || "").toLowerCase()
  const isAllowed =
    ALLOWED_TYPES.includes(mime) ||
    mime.startsWith("audio/")
  if (!isAllowed) {
    return NextResponse.json(
      { error: "Unsupported file type. Use mp3, wav, ogg, aac, flac, or webm." },
      { status: 400 }
    )
  }

  let result: { id: string }
  try {
    result = await createVoiceConsent({ name, language, recording: file })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create consent"
    const is403 = msg.includes("403") || msg.includes("access") || msg.includes("eligible")
    return NextResponse.json(
      { error: is403 ? "Voice Lab is not available for your organization." : msg },
      { status: is403 ? 403 : 500 }
    )
  }

  const { data: inserted, error: insertError } = await supabase
    .from("voice_consents")
    .insert({
      user_id: user.id,
      openai_consent_id: result.id,
      name,
      language,
    })
    .select("id, openai_consent_id, name, language, created_at")
    .single()

  if (insertError) {
    console.error("Failed to persist voice consent:", insertError)
    return NextResponse.json(
      { error: "Consent created but failed to save locally." },
      { status: 500 }
    )
  }

  return NextResponse.json({ consent: inserted })
}
