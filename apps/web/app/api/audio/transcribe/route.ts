import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createTranscription } from "@/lib/openai/audio"
import type { TranscriptionModel, TranscriptionResponseFormat } from "@/lib/openai/audio"

export const maxDuration = 120

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25 MB
const ALLOWED_TYPES = [
  "audio/mpeg", "audio/mp3", "audio/mp4", "audio/mpga", "audio/m4a",
  "audio/wav", "audio/webm", "audio/ogg", "video/mp4",
]

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

  const file = formData.get("file") as File | null
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum 25 MB." },
      { status: 400 }
    )
  }

  const mime = (file.type || "").toLowerCase()
  const isAllowed = ALLOWED_TYPES.includes(mime) || mime.startsWith("audio/")
  if (!isAllowed) {
    return NextResponse.json(
      { error: "Unsupported file type. Use mp3, mp4, mpeg, m4a, wav, or webm." },
      { status: 400 }
    )
  }

  const model = (formData.get("model") as TranscriptionModel) || "gpt-4o-transcribe"
  const response_format = (formData.get("response_format") as TranscriptionResponseFormat) || "json"
  const prompt = (formData.get("prompt") as string) || undefined
  const chunking_strategy =
    formData.get("chunking_strategy") === "auto" ? "auto" as const : undefined

  try {
    const transcript = await createTranscription({
      file,
      model,
      response_format,
      prompt,
      chunking_strategy:
        model === "gpt-4o-transcribe-diarize" && response_format === "diarized_json"
          ? chunking_strategy ?? "auto"
          : chunking_strategy,
    })

    const { error: insertError } = await supabase.from("audio_transcripts").insert({
      user_id: user.id,
      source_asset_id: null,
      task_type: "transcribe",
      model,
      response_format,
      raw_text: transcript.text ?? null,
      segments: transcript.segments ?? null,
      usage_json: transcript.usage ?? null,
    })

    if (insertError) {
      console.error("Failed to persist transcript:", insertError)
    }

    return NextResponse.json({ transcript })
  } catch (err) {
    console.error("Transcribe error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to transcribe" },
      { status: 500 }
    )
  }
}
