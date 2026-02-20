import OpenAI, { toFile } from "openai"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 30

const TRANSCRIBE_MODEL = "whisper-1"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response("OpenAI API key not configured", { status: 503 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return new Response("Invalid form data", { status: 400 })
  }

  const blob = formData.get("file") ?? formData.get("audio")
  if (!blob || !(blob instanceof Blob)) {
    return new Response("Missing or invalid audio file", { status: 400 })
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  try {
    const uploadable = await toFile(blob, "audio.webm", {
      type: blob.type || "audio/webm",
    })
    const transcription = await openai.audio.transcriptions.create({
      file: uploadable,
      model: process.env.OPENAI_TRANSCRIBE_MODEL ?? TRANSCRIBE_MODEL,
      response_format: "text",
    })

    const text = typeof transcription === "string" ? transcription : String(transcription ?? "").trim()

    return Response.json({ text })
  } catch (err) {
    console.error("LABZ transcribe error:", err)
    const message = err instanceof Error ? err.message : "Transcription failed"
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
