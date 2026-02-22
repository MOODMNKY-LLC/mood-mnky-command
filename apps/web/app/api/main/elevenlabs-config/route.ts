import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const CONFIG_ID = "default"

/** Ensure clients always get fresh config (no cached "agent not set" after LABZ save). */
export const dynamic = "force-dynamic"

export type MainElevenLabsConfigGet = {
  agentId: string | null
  defaultVoiceId: string | null
  audioSampleUrl: string | null
  showVoiceSection: boolean
  showAudioSample: boolean
  connectionType: "webrtc" | "websocket"
  showTranscriptViewer: boolean
  showWaveformInVoiceBlock: boolean
}

/**
 * GET: Returns Main ElevenLabs config (public fields only). Used by Main page for voice block and Listen section.
 * Server-only: no API keys; safe for unauthenticated Main landing.
 */
export async function GET() {
  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from("main_elevenlabs_config")
    .select("agent_id, default_voice_id, audio_sample_url, show_voice_section, show_audio_sample, connection_type, show_transcript_viewer, show_waveform_in_voice_block")
    .eq("id", CONFIG_ID)
    .maybeSingle()

  if (process.env.NODE_ENV === "development") {
    console.debug("[main/elevenlabs-config] GET:", row ? { hasAgentId: !!row.agent_id } : { row: null })
  }

  if (error) {
    console.error("Main ElevenLabs config GET error:", error)
    if (error.code === "42P01") {
      return NextResponse.json({
        agentId: null,
        defaultVoiceId: null,
        audioSampleUrl: process.env.NEXT_PUBLIC_MAIN_LANDING_AUDIO_SAMPLE_URL ?? null,
        showVoiceSection: true,
        showAudioSample: true,
        connectionType: "webrtc",
        showTranscriptViewer: false,
        showWaveformInVoiceBlock: false,
      } satisfies MainElevenLabsConfigGet)
    }
    return NextResponse.json(
      { error: "Failed to load config" },
      { status: 500 }
    )
  }

  const connectionType = (row?.connection_type === "websocket" ? "websocket" : "webrtc") as "webrtc" | "websocket"
  const response: MainElevenLabsConfigGet = {
    agentId: row?.agent_id ?? null,
    defaultVoiceId: row?.default_voice_id ?? null,
    audioSampleUrl: row?.audio_sample_url ?? process.env.NEXT_PUBLIC_MAIN_LANDING_AUDIO_SAMPLE_URL ?? null,
    showVoiceSection: row?.show_voice_section ?? true,
    showAudioSample: row?.show_audio_sample ?? true,
    connectionType,
    showTranscriptViewer: row?.show_transcript_viewer ?? false,
    showWaveformInVoiceBlock: row?.show_waveform_in_voice_block ?? false,
  }

  const res = NextResponse.json(response)
  res.headers.set("Cache-Control", "no-store, max-age=0")
  return res
}

/**
 * PATCH: Update Main ElevenLabs config (admin only). Body: agentId?, defaultVoiceId?, audioSampleUrl?, showVoiceSection?, showAudioSample?
 */
export async function PATCH(request: NextRequest) {
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

  let body: {
    agentId?: string
    defaultVoiceId?: string
    audioSampleUrl?: string | null
    showVoiceSection?: boolean
    showAudioSample?: boolean
    connectionType?: "webrtc" | "websocket"
    showTranscriptViewer?: boolean
    showWaveformInVoiceBlock?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (body.agentId !== undefined) updates.agent_id = body.agentId?.trim() || null
  if (body.defaultVoiceId !== undefined) updates.default_voice_id = body.defaultVoiceId?.trim() || null
  if (Object.prototype.hasOwnProperty.call(body, "audioSampleUrl")) updates.audio_sample_url = body.audioSampleUrl?.trim() || null
  if (body.showVoiceSection !== undefined) updates.show_voice_section = body.showVoiceSection
  if (body.showAudioSample !== undefined) updates.show_audio_sample = body.showAudioSample
  if (body.connectionType !== undefined) updates.connection_type = body.connectionType
  if (body.showTranscriptViewer !== undefined) updates.show_transcript_viewer = body.showTranscriptViewer
  if (body.showWaveformInVoiceBlock !== undefined) updates.show_waveform_in_voice_block = body.showWaveformInVoiceBlock

  const { data, error } = await admin
    .from("main_elevenlabs_config")
    .upsert({ id: CONFIG_ID, ...updates }, { onConflict: "id" })
    .select("agent_id, default_voice_id, audio_sample_url, show_voice_section, show_audio_sample, connection_type, show_transcript_viewer, show_waveform_in_voice_block")
    .single()

  if (error) {
    console.error("Main ElevenLabs config PATCH error:", error)
    const message =
      process.env.NODE_ENV === "development"
        ? (error.message || "Failed to save config")
        : "Failed to save config"
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const connectionType = (data?.connection_type === "websocket" ? "websocket" : "webrtc") as "webrtc" | "websocket"
  return NextResponse.json({
    agentId: data?.agent_id ?? null,
    defaultVoiceId: data?.default_voice_id ?? null,
    audioSampleUrl: data?.audio_sample_url ?? null,
    showVoiceSection: data?.show_voice_section ?? true,
    showAudioSample: data?.show_audio_sample ?? true,
    connectionType,
    showTranscriptViewer: data?.show_transcript_viewer ?? false,
    showWaveformInVoiceBlock: data?.show_waveform_in_voice_block ?? false,
  })
}
