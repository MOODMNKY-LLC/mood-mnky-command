import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const CONFIG_ID = "default"

export type MainElevenLabsConfigGet = {
  agentId: string | null
  defaultVoiceId: string | null
  audioSampleUrl: string | null
  showVoiceSection: boolean
  showAudioSample: boolean
}

/**
 * GET: Returns Main ElevenLabs config (public fields only). Used by Main page for voice block and Listen section.
 * Server-only: no API keys; safe for unauthenticated Main landing.
 */
export async function GET() {
  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from("main_elevenlabs_config")
    .select("agent_id, default_voice_id, audio_sample_url, show_voice_section, show_audio_sample")
    .eq("id", CONFIG_ID)
    .maybeSingle()

  if (error) {
    console.error("Main ElevenLabs config GET error:", error)
    if (error.code === "42P01") {
      return NextResponse.json({
        agentId: null,
        defaultVoiceId: null,
        audioSampleUrl: process.env.NEXT_PUBLIC_MAIN_LANDING_AUDIO_SAMPLE_URL ?? null,
        showVoiceSection: true,
        showAudioSample: true,
      } satisfies MainElevenLabsConfigGet)
    }
    return NextResponse.json(
      { error: "Failed to load config" },
      { status: 500 }
    )
  }

  const response: MainElevenLabsConfigGet = {
    agentId: row?.agent_id ?? null,
    defaultVoiceId: row?.default_voice_id ?? null,
    audioSampleUrl: row?.audio_sample_url ?? process.env.NEXT_PUBLIC_MAIN_LANDING_AUDIO_SAMPLE_URL ?? null,
    showVoiceSection: row?.show_voice_section ?? true,
    showAudioSample: row?.show_audio_sample ?? true,
  }

  return NextResponse.json(response)
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

  const { data, error } = await admin
    .from("main_elevenlabs_config")
    .upsert({ id: CONFIG_ID, ...updates }, { onConflict: "id" })
    .select("agent_id, default_voice_id, audio_sample_url, show_voice_section, show_audio_sample")
    .single()

  if (error) {
    console.error("Main ElevenLabs config PATCH error:", error)
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 })
  }

  return NextResponse.json({
    agentId: data?.agent_id ?? null,
    defaultVoiceId: data?.default_voice_id ?? null,
    audioSampleUrl: data?.audio_sample_url ?? null,
    showVoiceSection: data?.show_voice_section ?? true,
    showAudioSample: data?.show_audio_sample ?? true,
  })
}
