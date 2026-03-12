/**
 * Server-side OpenAI — not routed through Flowise.
 * See docs/AI-SEPARATION-REPORT.md.
 */
import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { openai } from "@ai-sdk/openai"
import { createClient } from "@/lib/supabase/server"
import { getLabzConfig, resolveSystemPrompt } from "@/lib/chat/labz-config"
import { labzTools } from "@/lib/chat/labz-tools"
import { isLabzAllowedModelOrPrefix, LABZ_DEFAULT_MODEL } from "@/lib/chat/labz-constants"

export const maxDuration = 30

interface LabzChatBody {
  messages: UIMessage[]
  /** Optional model id; must be allowed (see isLabzAllowedModelOrPrefix). */
  model?: string
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

  let body: LabzChatBody
  try {
    body = await request.json()
  } catch {
    return new Response("Invalid JSON body", { status: 400 })
  }

  const { messages, model: bodyModel } = body
  if (!messages || !Array.isArray(messages)) {
    return new Response("messages is required", { status: 400 })
  }

  const config = await getLabzConfig()
  const modelId =
    bodyModel && isLabzAllowedModelOrPrefix(bodyModel)
      ? bodyModel
      : isLabzAllowedModelOrPrefix(config.default_model)
        ? config.default_model
        : LABZ_DEFAULT_MODEL

  let tools = labzTools
  if (config.tool_overrides && Object.keys(config.tool_overrides).length > 0) {
    const filtered: Record<string, (typeof labzTools)[keyof typeof labzTools]> = {}
    for (const [key, tool] of Object.entries(labzTools)) {
      if (config.tool_overrides[key] !== false) filtered[key] = tool
    }
    tools = filtered
  }

  const result = streamText({
    model: openai(modelId),
    system: resolveSystemPrompt(config),
    messages: await convertToModelMessages(messages),
    tools,
  })

  return result.toUIMessageStreamResponse()
}
