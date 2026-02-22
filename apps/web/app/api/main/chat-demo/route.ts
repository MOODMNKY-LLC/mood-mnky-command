import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { openai } from "@ai-sdk/openai"
import { checkRateLimit } from "@/lib/rate-limit"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 30

const MAIN_CHAT_DEMO_MODEL = "gpt-4o-mini"
const MAX_MESSAGES = 10

const MAIN_DEMO_SYSTEM_PROMPT = `You are MOOD MNKY—the voice of the MOOD MNKY brand. This is a public demo on the main marketing site. You help visitors learn about MOOD MNKY and the MNKY VERSE.

**About MOOD MNKY:**
- MOOD MNKY is a technological organism integrating physical products, digital experiences, and AI-driven personalization.
- Bespoke fragrance, sensory journeys, extreme personalization. Always scentsing the MOOD.
- Three pillars: MNKY VERSE (web portal), The Dojo (members' hub), MNKY LABZ (command center).
- Three AI agents: MOOD MNKY (customer experience), SAGE MNKY (knowledge/learning), CODE MNKY (technical).

**Your style:**
- Warm, concise, on-brand. No jargon.
- Suggest next steps: Join MNKY VERSE, try the Fragrance Wheel, explore the Blending Lab.
- Direct them to https://mnky-verse.moodmnky.com for the full experience.
- Keep replies short (2-4 paragraphs max). No product data or real-time search—general guidance only.

**What you help with:**
- Brand overview, ecosystem, and value proposition.
- What is the MNKY VERSE, Dojo, and Blending Lab.
- General fragrance and self-care guidance.

**What you don't do:**
- Formula creation, lab workflows, or admin tasks.
- Product recommendations with specific SKUs (direct to the shop).`

async function getSystemPromptForAgent(agentSlug: string | null): Promise<string> {
  if (!agentSlug) return MAIN_DEMO_SYSTEM_PROMPT
  const supabase = await createClient()
  const { data } = await supabase
    .from("agent_profiles")
    .select("system_instructions")
    .eq("slug", agentSlug)
    .eq("is_active", true)
    .single()
  const instructions = data?.system_instructions?.trim()
  if (instructions) return instructions
  return MAIN_DEMO_SYSTEM_PROMPT
}

function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown"
  return headers.get("x-real-ip") ?? "unknown"
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Chat demo is not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    )
  }

  const ip = getClientIp(request.headers)
  const rateLimit = await checkRateLimit(`main:chat-demo:${ip}`)
  if (!rateLimit.ok) {
    return new Response(
      JSON.stringify({
        error: "Too many requests. Please try again later.",
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    )
  }

  let body: { messages: UIMessage[]; agentSlug?: string | null }
  try {
    body = await request.json()
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  const { messages, agentSlug } = body
  if (!messages || !Array.isArray(messages)) {
    return new Response(
      JSON.stringify({ error: "messages is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  if (messages.length > MAX_MESSAGES * 2) {
    return new Response(
      JSON.stringify({ error: "Message limit reached. Start a new chat." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    )
  }

  const systemPrompt = await getSystemPromptForAgent(agentSlug ?? null)

  const result = streamText({
    model: openai(MAIN_CHAT_DEMO_MODEL),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxSteps: 1,
  })

  return result.toDataStreamResponse()
}
