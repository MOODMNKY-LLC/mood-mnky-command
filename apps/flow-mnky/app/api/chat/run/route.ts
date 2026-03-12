/**
 * POST /api/chat/run
 * BFF proxy: receives messages from the client, calls Flowise prediction,
 * and streams the SSE response back. Flowise API key never leaves the server.
 *
 * Body: { chatflowId, question, chatId?, history?, uploads? }
 */
import { streamPrediction, streamPredictionWithSDK, syncPrediction } from '@/lib/flowise/client'
import type { FlowisePredictionPayload } from '@/lib/flowise/client'

export const maxDuration = 60

export async function POST(req: Request) {
  const body = await req.json() as {
    chatflowId: string
    question: string
    chatId?: string
    streaming?: boolean
    history?: FlowisePredictionPayload['history']
    uploads?: FlowisePredictionPayload['uploads']
  }

  const { chatflowId, question, chatId, streaming = true, history, uploads } = body

  const hasQuestion = Boolean(question?.trim())
  const hasUploads = Boolean(uploads?.length)
  if (!chatflowId || (!hasQuestion && !hasUploads)) {
    return Response.json(
      { error: 'chatflowId and either question or uploads are required' },
      { status: 400 }
    )
  }

  // Flowise requires a non-empty question; use placeholder when only uploads are sent
  const questionForFlowise = question?.trim() || (hasUploads ? 'Describe the attached file(s).' : '')

  const payload: FlowisePredictionPayload = {
    question: questionForFlowise,
    ...(chatId ? { chatId } : {}),
    ...(history?.length ? { history } : {}),
    ...(uploads?.length ? { uploads } : {}),
  }

  try {
    if (streaming) {
      const headers = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      }
      try {
        const stream = await streamPredictionWithSDK(chatflowId, payload)
        return new Response(stream, { headers })
      } catch (sdkErr) {
        console.warn('[api/chat/run] SDK stream failed, using fetch:', sdkErr instanceof Error ? sdkErr.message : sdkErr)
        const stream = await streamPrediction(chatflowId, payload)
        return new Response(stream, { headers })
      }
    }

    const result = await syncPrediction(chatflowId, payload)
    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Prediction failed'
    console.error('[api/chat/run]', message, err)
    return Response.json({ error: message }, { status: 502 })
  }
}
