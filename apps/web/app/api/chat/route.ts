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

const LAST_N_MESSAGES = 20

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
  sessionId?: string
}

function getTextFromUIMessage(message: UIMessage): string {
  if (!message.parts?.length) return ""
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text" && "text" in p)
    .map((p) => p.text)
    .join("")
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
    sessionId: requestedSessionId,
  } = body
  if (!messages || !Array.isArray(messages)) {
    return new Response("messages is required", { status: 400 })
  }

  let sessionId: string
  if (requestedSessionId) {
    const { data: session } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", requestedSessionId)
      .eq("user_id", user.id)
      .single()
    if (session) {
      sessionId = session.id
      await supabase.from("chat_sessions").update({ updated_at: new Date().toISOString() }).eq("id", sessionId)
    } else {
      const { data: newSession, error } = await supabase
        .from("chat_sessions")
        .insert({ user_id: user.id })
        .select("id")
        .single()
      if (error) return new Response("Failed to create session", { status: 500 })
      sessionId = newSession.id
    }
  } else {
    const { data: newSession, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id })
      .select("id")
      .single()
    if (error) return new Response("Failed to create session", { status: 500 })
    sessionId = newSession.id
  }

  const lastMessage = messages[messages.length - 1]
  if (lastMessage?.role === "user") {
    const content = getTextFromUIMessage(lastMessage)
    if (content) {
      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        role: "user",
        content,
      })
    }
  }

  const { data: recentRows } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(LAST_N_MESSAGES)

  const model = ALLOWED_MODELS.includes(modelParam as (typeof ALLOWED_MODELS)[number])
    ? modelParam
    : "gpt-5-mini"

  const tools = webSearch
    ? {
        ...chatTools,
        web_search: openai.tools.webSearch({ searchContextSize: "medium" }),
      }
    : chatTools

  let systemPrompt =
    mode === "blending"
      ? MOOD_MNKY_SYSTEM_PROMPT + BLENDING_MODE_SUFFIX
      : MOOD_MNKY_SYSTEM_PROMPT

  if (recentRows?.length) {
    const recentContext = recentRows
      .map((m) => (m.role === "user" ? `User: ${m.content}` : m.role === "assistant" ? `Assistant: ${m.content}` : null))
      .filter(Boolean)
      .join("\n")
    systemPrompt = `${systemPrompt}\n\nRecent conversation context (for continuity):\n${recentContext}`
  }

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

  const response = result.toUIMessageStreamResponse({
    onFinish: async ({ responseMessage }) => {
      if (responseMessage?.role === "assistant") {
        const content = getTextFromUIMessage(responseMessage)
        if (content) {
          const client = await createClient()
          await client.from("chat_messages").insert({
            session_id: sessionId,
            role: "assistant",
            content,
          })
        }
      }
    },
  })

  const newHeaders = new Headers(response.headers)
  newHeaders.set("x-chat-session-id", sessionId)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}
