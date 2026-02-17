import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { openai } from "@ai-sdk/openai"
import { createClient } from "@/lib/supabase/server"
import { VERSE_SYSTEM_PROMPT } from "@/lib/chat/verse-system-prompt"

export const maxDuration = 30

// 5-series only; default to most cost-effective (nano)
const VERSE_DEFAULT_MODEL = "gpt-5-nano"
const VERSE_ALLOWED_MODELS = ["gpt-5-nano", "gpt-5-mini", "gpt-5.2", "gpt-5.2-pro"] as const
const LAST_N_MESSAGES = 20

interface VerseChatBody {
  messages: UIMessage[]
  model?: string
  sessionId?: string
}

function getTextFromUIMessage(message: UIMessage): string {
  if (!message.parts?.length) return ""
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text" && "text" in p)
    .map((p) => p.text)
    .join("")
}

function getAttachmentsFromUIMessage(message: UIMessage): { url: string; filename?: string; mediaType?: string }[] {
  if (!message.parts?.length) return []
  return message.parts
    .filter((p): p is { type: "file"; url: string; filename?: string; mediaType?: string } => p.type === "file" && "url" in p)
    .map((p) => ({ url: p.url, filename: p.filename, mediaType: p.mediaType }))
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

  let body: VerseChatBody
  try {
    body = await request.json()
  } catch {
    return new Response("Invalid JSON body", { status: 400 })
  }

  const { messages, sessionId: requestedSessionId, model: requestedModel } = body
  if (!messages || !Array.isArray(messages)) {
    return new Response("messages is required", { status: 400 })
  }

  const model =
    requestedModel && VERSE_ALLOWED_MODELS.includes(requestedModel as (typeof VERSE_ALLOWED_MODELS)[number])
      ? requestedModel
      : VERSE_DEFAULT_MODEL

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
    const attachments = getAttachmentsFromUIMessage(lastMessage)
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "user",
      content: content || "(attachment)",
      attachments: attachments.length ? attachments : [],
    })
  }

  const { data: recentRows } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(LAST_N_MESSAGES)

  let systemPrompt = VERSE_SYSTEM_PROMPT
  if (recentRows?.length) {
    const recentContext = recentRows
      .map((m) => (m.role === "user" ? `User: ${m.content}` : m.role === "assistant" ? `Assistant: ${m.content}` : null))
      .filter(Boolean)
      .join("\n")
    systemPrompt = `${VERSE_SYSTEM_PROMPT}\n\nRecent conversation context (for continuity):\n${recentContext}`
  }

  const result = streamText({
    model: openai(model),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
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
