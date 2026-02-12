import OpenAI from "openai"

export type TTSModel = "gpt-4o-mini-tts" | "tts-1" | "tts-1-hd"
export type TTSVoice =
  | "alloy"
  | "ash"
  | "ballad"
  | "coral"
  | "echo"
  | "fable"
  | "nova"
  | "onyx"
  | "sage"
  | "shimmer"
  | "verse"
  | "marin"
  | "cedar"
export type TTSFormat = "mp3" | "opus" | "aac" | "flac" | "wav" | "pcm"

export type TranscriptionModel =
  | "gpt-4o-transcribe"
  | "gpt-4o-mini-transcribe"
  | "gpt-4o-transcribe-diarize"
export type TranscriptionResponseFormat = "json" | "text" | "srt" | "verbose_json" | "vtt" | "diarized_json"

export interface CreateSpeechOptions {
  input: string
  model?: TTSModel
  voice: TTSVoice | { id: string }
  response_format?: TTSFormat
  speed?: number
  instructions?: string
  stream?: boolean
}

export interface CreateTranscriptionOptions {
  file: File | Blob
  model?: TranscriptionModel
  response_format?: TranscriptionResponseFormat
  language?: string
  prompt?: string
  stream?: boolean
  chunking_strategy?: "auto" | "none"
  /** For diarization: known speaker names */
  known_speaker_names?: string[]
  /** For diarization: base64 data URLs of reference clips */
  known_speaker_references?: string[]
}

export interface CreateTranslationOptions {
  file: File | Blob
  model?: "whisper-1"
  response_format?: "json" | "text" | "srt" | "verbose_json" | "vtt"
}

function getClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error("OPENAI_API_KEY is not set")
  return new OpenAI({ apiKey: key })
}

/**
 * Generate speech from text (TTS).
 * Returns a Buffer of the audio data.
 */
export async function createSpeech(options: CreateSpeechOptions): Promise<Buffer> {
  const client = getClient()
  const {
    input,
    model = "gpt-4o-mini-tts",
    voice,
    response_format = "mp3",
    speed,
    instructions,
    stream = false,
  } = options

  const params: Parameters<typeof client.audio.speech.create>[0] = {
    model,
    input,
    voice: typeof voice === "string" ? voice : voice,
    response_format,
  }
  if (speed != null) params.speed = speed
  if (instructions) params.instructions = instructions

  const response = await client.audio.speech.create(params)
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Generate speech from text (TTS) with streaming response.
 * Returns a ReadableStream for incremental playback.
 */
export async function createSpeechStream(
  options: CreateSpeechOptions
): Promise<ReadableStream<Uint8Array>> {
  const client = getClient()
  const {
    input,
    model = "gpt-4o-mini-tts",
    voice,
    response_format = "mp3",
    speed,
    instructions,
  } = options

  const params: Parameters<typeof client.audio.speech.create>[0] = {
    model,
    input,
    voice: typeof voice === "string" ? voice : voice,
    response_format,
    stream: true,
  }
  if (speed != null) params.speed = speed
  if (instructions) params.instructions = instructions

  const response = await client.audio.speech.create(params)
  return response.body as unknown as ReadableStream<Uint8Array>
}

/**
 * Transcribe audio to text.
 */
export async function createTranscription(
  options: CreateTranscriptionOptions
): Promise<{
  text?: string
  segments?: Array<{ start: number; end: number; text: string; speaker?: string }>
  words?: Array<{ word: string; start: number; end: number }>
  usage?: Record<string, unknown>
  [key: string]: unknown
}> {
  const client = getClient()
  const {
    file,
    model = "gpt-4o-transcribe",
    response_format = "json",
    language,
    prompt,
    stream = false,
    chunking_strategy,
    known_speaker_names,
    known_speaker_references,
  } = options

  const fileObj = file instanceof File ? file : new File([file], "audio", { type: "audio/mpeg" })

  const params: Record<string, unknown> = {
    file: fileObj,
    model,
    response_format,
  }
  if (language) params.language = language
  if (prompt) params.prompt = prompt
  if (stream) params.stream = true
  if (chunking_strategy) params.chunking_strategy = chunking_strategy
  if (known_speaker_names?.length || known_speaker_references?.length) {
    params.extra_body = {
      ...(known_speaker_names?.length && { known_speaker_names }),
      ...(known_speaker_references?.length && { known_speaker_references }),
    }
  }

  const transcription = await client.audio.transcriptions.create(
    params as Parameters<typeof client.audio.transcriptions.create>[0]
  )
  return transcription as typeof transcription & Record<string, unknown>
}

/**
 * Translate audio to English.
 */
export async function createTranslation(
  options: CreateTranslationOptions
): Promise<{ text: string; [key: string]: unknown }> {
  const client = getClient()
  const { file, model = "whisper-1", response_format = "json" } = options

  const fileObj = file instanceof File ? file : new File([file], "audio", { type: "audio/mpeg" })

  const translation = await client.audio.translations.create({
    file: fileObj,
    model,
    response_format,
  } as Parameters<typeof client.audio.translations.create>[0])
  return translation as typeof translation & Record<string, unknown>
}

/** Voice consent/voice API base URL */
const AUDIO_API = "https://api.openai.com/v1/audio"

async function audioFetch(
  path: string,
  init: RequestInit
): Promise<Response> {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error("OPENAI_API_KEY is not set")
  return fetch(`${AUDIO_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(init.headers as Record<string, string>),
    },
  })
}

export interface VoiceConsentResult {
  id: string
  object: string
  created_at?: number
  language?: string
  name?: string
}

export interface VoiceResult {
  id: string
  object: string
  created_at?: number
  name?: string
}

/**
 * Create a voice consent recording (Voice Lab).
 * Custom voices are limited to eligible customers. Handle 403 gracefully.
 */
export async function createVoiceConsent(params: {
  name: string
  language: string
  recording: File | Blob
}): Promise<VoiceConsentResult> {
  const form = new FormData()
  form.append("name", params.name)
  form.append("language", params.language)
  const file =
    params.recording instanceof File
      ? params.recording
      : new File([params.recording], "consent.wav", { type: "audio/wav" })
  form.append("recording", file)

  const res = await audioFetch("/voice_consents", {
    method: "POST",
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Voice consent failed: ${res.status}`)
  }
  return res.json()
}

/**
 * List voice consents (Voice Lab).
 */
export async function listVoiceConsents(params?: {
  after?: string
  limit?: number
}): Promise<{ data: VoiceConsentResult[]; has_more?: boolean }> {
  const q = new URLSearchParams()
  if (params?.after) q.set("after", params.after)
  if (params?.limit != null) q.set("limit", String(params.limit))
  const url = `/voice_consents${q.toString() ? `?${q}` : ""}`
  const res = await audioFetch(url, { method: "GET" })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `List voice consents failed: ${res.status}`)
  }
  return res.json()
}

/**
 * Create a custom voice (Voice Lab).
 * Requires a consent_id from createVoiceConsent.
 */
export async function createVoice(params: {
  name: string
  consent: string
  audio_sample: File | Blob
}): Promise<VoiceResult> {
  const form = new FormData()
  form.append("name", params.name)
  form.append("consent", params.consent)
  const file =
    params.audio_sample instanceof File
      ? params.audio_sample
      : new File([params.audio_sample], "sample.wav", { type: "audio/wav" })
  form.append("audio_sample", file)

  const res = await audioFetch("/voices", {
    method: "POST",
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Create voice failed: ${res.status}`)
  }
  return res.json()
}
