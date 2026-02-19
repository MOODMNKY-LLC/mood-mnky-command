import { createClient } from "@/lib/supabase/server"

/**
 * Fallback list when OpenAI Models API is unavailable.
 * Includes five series and gpt-4o family for chat completions.
 */
const LABZ_MODELS_FALLBACK: { id: string; displayName: string }[] = [
  { id: "gpt-5", displayName: "GPT-5" },
  { id: "gpt-5-mini", displayName: "GPT-5 Mini" },
  { id: "gpt-5-nano", displayName: "GPT-5 Nano" },
  { id: "o3-mini", displayName: "o3 Mini" },
  { id: "o3", displayName: "o3" },
  { id: "o1", displayName: "o1" },
  { id: "o1-mini", displayName: "o1 Mini" },
  { id: "gpt-4o", displayName: "GPT-4o" },
  { id: "gpt-4o-mini", displayName: "GPT-4o Mini" },
  { id: "gpt-4o-nano", displayName: "GPT-4o Nano" },
]

/** Prefixes for chat-completion-capable models we allow in LABZ. */
const CHAT_MODEL_ID_PREFIXES = ["gpt-5", "gpt-4o", "gpt-4-turbo", "o1", "o3", "gpt-4-1106", "gpt-4-0613"]

function toDisplayName(id: string): string {
  const known: Record<string, string> = {
    "gpt-5": "GPT-5",
    "gpt-5-mini": "GPT-5 Mini",
    "gpt-5-nano": "GPT-5 Nano",
    "o3": "o3",
    "o3-mini": "o3 Mini",
    "o1": "o1",
    "o1-mini": "o1 Mini",
    "gpt-4o": "GPT-4o",
    "gpt-4o-mini": "GPT-4o Mini",
    "gpt-4o-nano": "GPT-4o Nano",
  }
  return known[id] ?? id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function isChatModel(id: string): boolean {
  return CHAT_MODEL_ID_PREFIXES.some((p) => id.startsWith(p))
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ models: LABZ_MODELS_FALLBACK }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ models: LABZ_MODELS_FALLBACK }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  }

  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) {
      return new Response(
        JSON.stringify({ models: LABZ_MODELS_FALLBACK }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }
    const data = (await res.json()) as { data?: { id: string }[] }
    const list = data.data ?? []
    const chatModels = list
      .filter((m) => isChatModel(m.id))
      .map((m) => ({ id: m.id, displayName: toDisplayName(m.id) }))
    const deduped = Array.from(new Map(chatModels.map((m) => [m.id, m])).values())
    const sorted = deduped.sort((a, b) => {
      const order = ["gpt-5", "o3", "o1", "gpt-4o"]
      const ai = order.findIndex((p) => a.id.startsWith(p))
      const bi = order.findIndex((p) => b.id.startsWith(p))
      if (ai !== -1 && bi !== -1) return ai - bi
      if (ai !== -1) return -1
      if (bi !== -1) return 1
      return a.id.localeCompare(b.id)
    })
    return new Response(JSON.stringify({ models: sorted.length > 0 ? sorted : LABZ_MODELS_FALLBACK }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch {
    return new Response(JSON.stringify({ models: LABZ_MODELS_FALLBACK }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }
}
