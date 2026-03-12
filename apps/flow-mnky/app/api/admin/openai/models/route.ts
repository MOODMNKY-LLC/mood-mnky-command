/**
 * GET /api/admin/openai/models
 * Lists OpenAI models using the official API (for admin model allow list).
 * Requires OPENAI_API_KEY and admin auth.
 */
import { requireAdmin } from '@/lib/auth/require-admin'

interface OpenAIModel {
  id: string
  object: string
  created?: number
  owned_by?: string
}

interface OpenAIModelsResponse {
  object: string
  data: OpenAIModel[]
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return Response.json(
      { error: 'OPENAI_API_KEY is not set. Add it to server env to list models.' },
      { status: 503 }
    )
  }
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      const text = await res.text()
      return Response.json(
        { error: `OpenAI API ${res.status}: ${text.slice(0, 200)}` },
        { status: 502 }
      )
    }
    const body = (await res.json()) as OpenAIModelsResponse
    const models = (body.data ?? []).map((m) => ({ id: m.id, owned_by: m.owned_by ?? '' }))
    return Response.json({ models })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch OpenAI models' },
      { status: 502 }
    )
  }
}
