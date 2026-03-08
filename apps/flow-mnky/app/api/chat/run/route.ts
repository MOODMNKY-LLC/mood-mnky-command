/**
 * POST /api/chat/run
 * BFF proxy: receives messages from the client, calls Flowise prediction,
 * and streams the SSE response back. Flowise API key never leaves the server.
 *
 * Body: { chatflowId, question, chatId?, history?, uploads? }
 */
import { streamPrediction, syncPrediction } from '@/lib/flowise/client'
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
      const stream = await streamPrediction(chatflowId, payload)
      
      // Convert stream to SSE format if needed
      const encoder = new TextEncoder()
      const wrappedStream = new ReadableStream({
        async start(controller) {
          const reader = stream.getReader()
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              
              // Forward raw bytes from Flowise
              controller.enqueue(value)
            }
            controller.close()
          } catch (err) {
            controller.error(err)
          } finally {
            reader.releaseLock()
          }
        },
      })
      
      return new Response(wrappedStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      })
    }

    const result = await syncPrediction(chatflowId, payload)
    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Prediction failed'
    console.error('[api/chat/run]', message, err)
    return Response.json({ error: message }, { status: 502 })
  }
}
