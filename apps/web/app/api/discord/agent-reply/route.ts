import { NextResponse } from "next/server"
import { requireInternalApiKey } from "@/lib/api/internal-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAgentSlug } from "@/lib/agents"
import { getFallbackAgentProfile } from "@/lib/agents"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

const DISCORD_AGENT_MODEL = "gpt-4o-mini"

/**
 * POST /api/discord/agent-reply
 * Body: { agentSlug: string, message: string, discordUserId?: string, channelId?: string }
 * Returns: { text: string } or { error: string }
 * Auth: Bearer MOODMNKY_API_KEY (used by Discord bots).
 * Single turn: no session; uses agent_profiles.system_instructions (or fallback) + user message.
 */
export async function POST(request: Request) {
  if (!requireInternalApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 503 }
    )
  }

  let body: { agentSlug?: string; message?: string; discordUserId?: string; channelId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { agentSlug, message } = body
  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json(
      { error: "message is required and must be a non-empty string" },
      { status: 400 }
    )
  }

  const slug = isAgentSlug(agentSlug ?? null) ? agentSlug! : "mood_mnky"
  const admin = createAdminClient()
  const { data: agent } = await admin
    .from("agent_profiles")
    .select("system_instructions")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  const systemInstructions = agent?.system_instructions?.trim()
  const fallback = getFallbackAgentProfile(slug)
  const systemPrompt =
    systemInstructions ||
    fallback.blurb ||
    `You are ${fallback.display_name}. Reply in a helpful, concise way. Keep replies under 500 characters when possible.`

  try {
    const { text } = await generateText({
      model: openai(DISCORD_AGENT_MODEL),
      system: systemPrompt,
      messages: [{ role: "user", content: message.trim() }],
      maxTokens: 1024,
    })
    return NextResponse.json({ text: text ?? "" })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "AI error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
