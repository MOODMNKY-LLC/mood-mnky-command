import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createVoice } from "@/lib/openai/audio"

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
    .from("custom_voices")
    .select("id, openai_voice_id, name, consent_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("List custom voices error:", error)
    return NextResponse.json(
      { error: error.message ?? "Failed to list voices" },
      { status: 500 }
    )
  }

  return NextResponse.json({ voices: data ?? [] })
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

  const name = (formData.get("name") as string)?.trim()
  const consentId = (formData.get("consent_id") as string)?.trim()
  const file = formData.get("audio_sample") as File | null

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }
  if (!consentId) {
    return NextResponse.json({ error: "consent_id is required" }, { status: 400 })
  }
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "audio_sample file is required" },
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
    ALLOWED_TYPES.includes(mime) || mime.startsWith("audio/")
  if (!isAllowed) {
    return NextResponse.json(
      { error: "Unsupported file type. Use mp3, wav, ogg, aac, flac, or webm." },
      { status: 400 }
    )
  }

  const { data: consent, error: consentError } = await supabase
    .from("voice_consents")
    .select("id, openai_consent_id")
    .eq("user_id", user.id)
    .eq("id", consentId)
    .single()

  if (consentError || !consent) {
    return NextResponse.json(
      { error: "Consent not found or access denied" },
      { status: 404 }
    )
  }

  let result: { id: string }
  try {
    result = await createVoice({
      name,
      consent: consent.openai_consent_id,
      audio_sample: file,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create voice"
    const is403 =
      msg.includes("403") ||
      msg.includes("access") ||
      msg.includes("eligible")
    return NextResponse.json(
      {
        error: is403
          ? "Voice Lab is not available for your organization."
          : msg,
      },
      { status: is403 ? 403 : 500 }
    )
  }

  const { data: inserted, error: insertError } = await supabase
    .from("custom_voices")
    .insert({
      user_id: user.id,
      consent_id: consent.id,
      openai_voice_id: result.id,
      name,
    })
    .select("id, openai_voice_id, name, consent_id, created_at")
    .single()

  if (insertError) {
    console.error("Failed to persist custom voice:", insertError)
    return NextResponse.json(
      { error: "Voice created but failed to save locally." },
      { status: 500 }
    )
  }

  return NextResponse.json({ voice: inserted })
}
