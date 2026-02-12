import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { openai } from "@ai-sdk/openai"
import { createClient } from "@/lib/supabase/server"
import { MOOD_MNKY_SYSTEM_PROMPT } from "@/lib/chat/system-prompt"
import { chatTools } from "@/lib/chat/tools"

export const maxDuration = 30

const ALLOWED_MODELS = [
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
  "o3-mini",
  "gpt-4o",
  "gpt-4o-mini",
] as const

function isReasoningModel(model: string): boolean {
  return (
    model.startsWith("gpt-5") && !model.startsWith("gpt-5-chat") ||
    model.startsWith("o3")
  )
}

const BLENDING_MODE_SUFFIX = `
[Blending mode active] The user is in a fragrance blending workflow. Follow the Full Lab-Style Blending Flow. Use search_fragrance_oils, get_fragrance_oil_by_id, calculate_blend_proportions, save_custom_blend, list_containers, calculate_wax_for_vessel, and list_saved_blends as needed. Be conversational, ask clarifying questions, and always end with 1–2 follow-up options.`

interface ChatBody {
  messages: UIMessage[]
  model?: string
  webSearch?: boolean
  mode?: "blending"
}

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

  let body: ChatBody
  try {
    body = await request.json()
  } catch {
    return new Response("Invalid JSON body", { status: 400 })
  }

  const {
    messages,
    model: modelParam = "gpt-5-mini",
    webSearch = false,
    mode,
  } = body
  if (!messages || !Array.isArray(messages)) {
    return new Response("messages is required", { status: 400 })
  }

  const model = ALLOWED_MODELS.includes(modelParam as (typeof ALLOWED_MODELS)[number])
    ? modelParam
    : "gpt-5-mini"

  const tools = webSearch
    ? {
        ...chatTools,
        web_search: openai.tools.webSearch({ searchContextSize: "medium" }),
      }
    : chatTools

  const systemPrompt =
    mode === "blending"
      ? MOOD_MNKY_SYSTEM_PROMPT + BLENDING_MODE_SUFFIX
      : MOOD_MNKY_SYSTEM_PROMPT

  const result = streamText({
    model: openai(model),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools,
    maxSteps: 5,
    providerOptions: isReasoningModel(model)
      ? {
          openai: {
            reasoningSummary: "detailed" as const,
            reasoningEffort: "medium" as const,
          },
        }
      : undefined,
  })

  return result.toUIMessageStreamResponse()
}
