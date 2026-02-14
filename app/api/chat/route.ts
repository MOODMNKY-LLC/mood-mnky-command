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
[Blending mode active] The user is in a fragrance blending workflow. Follow the Full Lab-Style Blending Flow.

CRITICAL—DO NOT VIOLATE:
1. Use exactly ONE search_fragrance_oils call with a combined query (e.g. "leather blood orange cinnamon vanilla"). Never make 4 separate searches—it wastes steps and causes the response to stall.
2. After search_fragrance_oils returns, you MUST NOT stop. You MUST immediately: (a) call calculate_blend_proportions with the oil IDs from the search results, (b) call show_blend_suggestions with those oils and proportions, and (c) write at least one sentence to the user. NEVER end your turn with only search results and no card.
3. Required sequence for blend requests: search_fragrance_oils (once) -> calculate_blend_proportions -> show_blend_suggestions -> text response. Do not stop midway.
4. When the user confirms they like a blend and want to save, call show_personalization_form first—unless they already gave a name (e.g. "Save as Cozy Vanilla").
5. When the user is starting a blend and you need preferences: prefer show_intake_form directly when they ask to be guided (e.g. "guide me through it"); otherwise call get_latest_funnel_submission (omit funnelId), and if submission is null, call show_intake_form.
6. Use show_product_picker when the user confirms their blend.
7. When you decide to call a tool, you MUST emit the tool call in the same response. Do not stop after reasoning—execute the call.

Tools: get_latest_funnel_submission, show_intake_form, search_fragrance_oils, get_fragrance_oil_by_id, calculate_blend_proportions, show_blend_suggestions, show_product_picker, show_personalization_form, save_custom_blend, list_containers, calculate_wax_for_vessel, list_saved_blends. Be conversational and always end with 1–2 follow-up options.`

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
    maxSteps: 10,
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
