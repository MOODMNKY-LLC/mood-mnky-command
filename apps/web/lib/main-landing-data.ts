import { createClient } from "@/lib/supabase/server"
import {
  createAdminClient,
  getSupabaseConfigMissing,
} from "@/lib/supabase/admin"
import { getThumbnailUrlFromPublicUrl } from "@/lib/supabase/storage"
import { dbRowToFragranceOil } from "@/lib/fragrance-oils-db"
import type { FragranceOil } from "@/lib/types"

export type MainLandingFaqItem = {
  id: string
  question: string
  answer: string
  sort_order: number
}

export type MainLandingFeatureItem = {
  id: string
  icon_name: string
  title: string
  description: string
  sort_order: number
}

export type MainLandingSocialProofItem = {
  id: string
  value: string
  label: string
  sort_order: number
}

export type MainLandingAgentItem = {
  slug: string
  displayName: string
  blurb: string | null
  imagePath: string
  model: string | null
  tools: string[]
}

export type MainLandingData = {
  faq: MainLandingFaqItem[]
  features: MainLandingFeatureItem[]
  socialProof: MainLandingSocialProofItem[]
}

export type MainElevenLabsConfig = {
  agentId: string | null
  defaultVoiceId: string | null
  audioSampleUrl: string | null
  showVoiceSection: boolean
  showAudioSample: boolean
  connectionType: "webrtc" | "websocket"
  showTranscriptViewer: boolean
  showWaveformInVoiceBlock: boolean
  pronunciationDictionaryLocators: Array<{
    pronunciation_dictionary_id: string
    version_id?: string
  }> | null
}

/**
 * Fetches public main landing content from Supabase.
 * Uses anon client; RLS allows SELECT for anon on main_landing_* tables.
 * Returns empty arrays on error or when tables are missing so the page falls back to static content.
 */
export async function getMainLandingData(): Promise<MainLandingData> {
  try {
    const supabase = await createClient()

    const [faqRes, featuresRes, socialRes] = await Promise.all([
      supabase
        .from("main_landing_faq")
        .select("id, question, answer, sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("main_landing_features")
        .select("id, icon_name, title, description, sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("main_landing_social_proof")
        .select("id, value, label, sort_order")
        .order("sort_order", { ascending: true }),
    ])

    return {
      faq: (faqRes.error ? [] : (faqRes.data ?? [])) as MainLandingFaqItem[],
      features: (featuresRes.error ? [] : (featuresRes.data ?? [])) as MainLandingFeatureItem[],
      socialProof: (socialRes.error ? [] : (socialRes.data ?? [])) as MainLandingSocialProofItem[],
    }
  } catch {
    return {
      faq: [],
      features: [],
      socialProof: [],
    }
  }
}

/**
 * Fetches active agent_profiles for Main section (character cards).
 * Uses anon client; RLS allows SELECT for anon on active agent_profiles.
 * Returns empty array on error.
 */
export async function getMainAgents(): Promise<MainLandingAgentItem[]> {
  try {
    const supabase = await createClient()
    const { data: rows, error } = await supabase
      .from("agent_profiles")
      .select("slug, display_name, blurb, image_path, openai_model, tools, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (error) return []
    return (rows ?? []).map((r) => ({
      slug: r.slug,
      displayName: r.display_name,
      blurb: r.blurb ?? null,
      imagePath: r.image_path ?? "/verse/mood-mnky-3d.png",
      model: r.openai_model ?? null,
      tools: (r.tools ?? []) as string[],
    }))
  } catch {
    return []
  }
}

const MAIN_ELEVENLABS_CONFIG_ID = "default"

/**
 * Fetches Main ElevenLabs config (agent_id, voice, audio sample URL, flags).
 * Uses anon client; RLS allows SELECT for anon on main_elevenlabs_config.
 * Returns defaults when table is missing or on error.
 */
export async function getMainElevenLabsConfig(): Promise<MainElevenLabsConfig> {
  try {
    const supabase = await createClient()
    const { data: row, error } = await supabase
      .from("main_elevenlabs_config")
      .select("agent_id, default_voice_id, audio_sample_url, show_voice_section, show_audio_sample, connection_type, show_transcript_viewer, show_waveform_in_voice_block")
      .eq("id", MAIN_ELEVENLABS_CONFIG_ID)
      .maybeSingle()

    // 42P01 = table missing, 42703 = column missing (e.g. migration not run); use defaults without logging
    const silentCodes = ["42P01", "42703"]
    if (error && !silentCodes.includes(error.code)) {
      console.error("getMainElevenLabsConfig error:", error.code, error.message, error)
    }

    const connectionType = row?.connection_type === "websocket" ? "websocket" : "webrtc"
    const pronDictId = process.env.ELEVENLABS_PRON_DICT_ID?.trim()
    const pronunciationDictionaryLocators =
      pronDictId
        ? [
            {
              pronunciation_dictionary_id: pronDictId,
              version_id: process.env.ELEVENLABS_PRON_DICT_VERSION_ID?.trim() || undefined,
            },
          ]
        : null
    return {
      agentId: row?.agent_id ?? null,
      defaultVoiceId: row?.default_voice_id ?? null,
      audioSampleUrl:
        row?.audio_sample_url ?? process.env.NEXT_PUBLIC_MAIN_LANDING_AUDIO_SAMPLE_URL ?? null,
      showVoiceSection: row?.show_voice_section ?? true,
      showAudioSample: row?.show_audio_sample ?? true,
      connectionType,
      showTranscriptViewer: row?.show_transcript_viewer ?? false,
      showWaveformInVoiceBlock: row?.show_waveform_in_voice_block ?? false,
      pronunciationDictionaryLocators,
    }
  } catch {
    return {
      agentId: null,
      defaultVoiceId: null,
      audioSampleUrl: process.env.NEXT_PUBLIC_MAIN_LANDING_AUDIO_SAMPLE_URL ?? null,
      showVoiceSection: true,
      showAudioSample: true,
      connectionType: "webrtc",
      showTranscriptViewer: false,
      showWaveformInVoiceBlock: false,
      pronunciationDictionaryLocators: null,
    }
  }
}

const FEATURED_FRAGRANCES_LIMIT = 24

/**
 * Fetches a limited set of fragrance oils for Main "Featured" section.
 * Uses admin client (fragrance_oils RLS is authenticated-only).
 * Returns empty array when admin config is missing or on error.
 */
export async function getMainFeaturedFragrances(): Promise<FragranceOil[]> {
  try {
    if (getSupabaseConfigMissing()) return []
    const supabase = createAdminClient()
    const { data: rows, error } = await supabase
      .from("fragrance_oils")
      .select("*, notion_url, image_url, image_source, allergen_statement")
      .order("name")
      .limit(FEATURED_FRAGRANCES_LIMIT)

    if (error) return []
    const oils = (rows ?? []).map((row) =>
      dbRowToFragranceOil(row as Parameters<typeof dbRowToFragranceOil>[0])
    ) as FragranceOil[]
    return oils.map((oil) => {
      if (oil.imageUrl) {
        try {
          const thumbnailUrl = getThumbnailUrlFromPublicUrl(
            supabase,
            oil.imageUrl
          )
          return { ...oil, thumbnailUrl }
        } catch {
          return oil
        }
      }
      return oil
    })
  } catch {
    return []
  }
}
