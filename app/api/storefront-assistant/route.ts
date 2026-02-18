import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { openai } from "@ai-sdk/openai"
import { createAdminClient } from "@/lib/supabase/admin"
import { STOREFRONT_SYSTEM_PROMPT } from "@/lib/chat/storefront-system-prompt"
import {
  searchProductsTool,
  getShopPoliciesTool,
  searchVerseBlogTool,
  searchKnowledgeBaseTool,
} from "@/lib/chat/storefront-tools"

export const maxDuration = 30

const STOREFRONT_DEFAULT_MODEL = "gpt-4o-mini"
const MAX_MESSAGES_PER_SESSION = 50
const LAST_N_MESSAGES = 15

function getTextFromUIMessage(message: UIMessage): string {
  if (!message.parts?.length) return ""
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text" && "text" in p)
    .map((p) => p.text)
    .join("")
}

function getAnonymousId(headers: Headers): string {
  return headers.get("x-mnky-anonymous-id") ?? crypto.randomUUID()
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response("OpenAI API key not configured", { status: 503 })
  }

  let body: { messages: UIMessage[]; sessionId?: string }
  try {
    body = await request.json()
  } catch {
    return new Response("Invalid JSON body", { status: 400 })
  }

  const { messages, sessionId: requestedSessionId } = body
  if (!messages || !Array.isArray(messages)) {
    return new Response("messages is required", { status: 400 })
  }

  const anonymousId = getAnonymousId(request.headers)
  const supabase = createAdminClient()

  let sessionId: string
  if (requestedSessionId) {
    const { data: session } = await supabase
      .from("storefront_chat_sessions")
      .select("id")
      .eq("id", requestedSessionId)
      .eq("anonymous_id", anonymousId)
      .single()
    if (session) {
      sessionId = session.id
      await supabase
        .from("storefront_chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId)
    } else {
      const { data: newSession, error } = await supabase
        .from("storefront_chat_sessions")
        .insert({ anonymous_id: anonymousId })
        .select("id")
        .single()
      if (error) {
        console.error("[storefront-assistant] Failed to create session (reuse path):", error)
        const body = { code: "SESSION_CREATE_FAILED", message: "Failed to create session" }
        if (process.env.NODE_ENV === "development") {
          ;(body as Record<string, string>).detail = error.message
        }
        return new Response(JSON.stringify(body), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      }
      sessionId = newSession!.id
    }
  } else {
    const { data: newSession, error } = await supabase
      .from("storefront_chat_sessions")
      .insert({ anonymous_id: anonymousId })
      .select("id")
      .single()
    if (error) {
      console.error("[storefront-assistant] Failed to create session:", error)
      const body = { code: "SESSION_CREATE_FAILED", message: "Failed to create session" }
      if (process.env.NODE_ENV === "development") {
        ;(body as Record<string, string>).detail = error.message
      }
      return new Response(JSON.stringify(body), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
    sessionId = newSession!.id
  }

  const { count } = await supabase
    .from("storefront_chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
  if (count !== null && count >= MAX_MESSAGES_PER_SESSION) {
    return new Response(
      JSON.stringify({ error: "Session message limit reached. Start a new chat." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    )
  }

  const lastMessage = messages[messages.length - 1]
  if (lastMessage?.role === "user") {
    const content = getTextFromUIMessage(lastMessage)
    await supabase.from("storefront_chat_messages").insert({
      session_id: sessionId,
      role: "user",
      content: content || "(empty)",
    })
  }

  const { data: recentRows } = await supabase
    .from("storefront_chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(LAST_N_MESSAGES)

  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "https://mnky-command.moodmnky.com"

  let systemPrompt = STOREFRONT_SYSTEM_PROMPT.replace(
    /\{app_base_url\}/g,
    appBaseUrl
  )
  if (recentRows?.length) {
    const recentContext = recentRows
      .map((m) =>
        m.role === "user"
          ? `User: ${m.content}`
          : m.role === "assistant"
            ? `Assistant: ${m.content}`
            : null
      )
      .filter(Boolean)
      .join("\n")
    systemPrompt = `${systemPrompt}\n\nRecent conversation context:\n${recentContext}`
  }

  const storefrontTools = {
    searchProducts: searchProductsTool,
    getShopPolicies: getShopPoliciesTool,
    searchVerseBlog: searchVerseBlogTool,
    searchKnowledgeBase: searchKnowledgeBaseTool,
  }

  const result = streamText({
    model: openai(STOREFRONT_DEFAULT_MODEL),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: storefrontTools,
    maxSteps: 5,
  })

  const response = result.toUIMessageStreamResponse({
    onFinish: async ({ responseMessage }) => {
      if (responseMessage?.role === "assistant") {
        const content = getTextFromUIMessage(responseMessage)
        if (content) {
          await supabase.from("storefront_chat_messages").insert({
            session_id: sessionId,
            role: "assistant",
            content,
          })
        }
      }
    },
  })

  const newHeaders = new Headers(response.headers)
  newHeaders.set("x-mnky-session-id", sessionId)
  newHeaders.set("Access-Control-Allow-Origin", "*")
  newHeaders.set("Access-Control-Expose-Headers", "x-mnky-session-id")
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-mnky-anonymous-id, x-mnky-session-id",
    },
  })
}
