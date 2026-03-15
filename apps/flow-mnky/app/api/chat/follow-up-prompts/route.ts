/**
 * POST /api/chat/follow-up-prompts
 * Generates 3–4 short follow-up questions from the given assistant message using OpenAI.
 * Used as a fallback when the Flowise chatflow does not provide followUpPrompts.
 * Requires OPENAI_API_KEY and authenticated user.
 */
import { requireUser } from '@/lib/auth/require-user'

const MAX_CONTENT_LENGTH = 12_000
const MODEL = 'gpt-4o-mini'

const SYSTEM_PROMPT = `You are a UX helper. Given an assistant's chat message, output 3 to 4 short follow-up questions that a user might naturally ask next. Each question must be one concise sentence. Return only a JSON array of strings, no markdown, no explanation. Example: ["What are the main steps?","Can you show an example?","How does this compare to X?"]`

export async function POST(req: Request) {
  const auth = await requireUser()
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return Response.json(
      { error: 'Follow-up prompts are unavailable (OpenAI not configured).' },
      { status: 503 }
    )
  }

  let body: { content?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const raw = typeof body.content === 'string' ? body.content : ''
  const content = stripReasoningFromContent(raw).trim().slice(0, MAX_CONTENT_LENGTH)
  if (!content) {
    return Response.json({ error: 'content is required and must be a non-empty string' }, { status: 400 })
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content },
        ],
        max_tokens: 256,
        temperature: 0.3,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[follow-up-prompts] OpenAI error:', res.status, err)
      return Response.json(
        { error: 'Failed to generate follow-up prompts' },
        { status: 502 }
      )
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const text = data.choices?.[0]?.message?.content?.trim() ?? ''
    const prompts = parsePromptsResponse(text)
    return Response.json({ prompts })
  } catch (err) {
    console.error('[follow-up-prompts]', err)
    return Response.json(
      { error: 'Failed to generate follow-up prompts' },
      { status: 502 }
    )
  }
}

/** Strip <think> and ```reasoning blocks so we don't base follow-ups on internal reasoning. */
function stripReasoningFromContent(content: string): string {
  let out = content
  const thinkMatch = out.match(/^<think>[\s\S]*?<\/think>\s*([\s\S]*)$/m)
  if (thinkMatch) out = thinkMatch[1].trim()
  const fenceMatch = out.match(/^```reasoning\s*\n[\s\S]*?```\s*([\s\S]*)$/m)
  if (fenceMatch) out = fenceMatch[1].trim()
  return out
}

function parsePromptsResponse(text: string): string[] {
  const trimmed = text.trim()
  // Strip possible markdown code fence
  const jsonStr = trimmed.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim()
  try {
    const parsed = JSON.parse(jsonStr) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).map((s) => s.trim()).slice(0, 6)
  } catch {
    return []
  }
}
