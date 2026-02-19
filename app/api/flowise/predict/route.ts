import { createClient } from "@/lib/supabase/server"
import { getFlowiseClient } from "@/lib/flowise/client"

export const maxDuration = 60

interface PredictBody {
  chatflowId: string
  question: string
  history?: Array<{ message: string; type: string }>
  overrideConfig?: Record<string, unknown>
  streaming?: boolean
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  let body: PredictBody
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { chatflowId, question, history, overrideConfig, streaming = false } = body
  if (!chatflowId || typeof question !== "string") {
    return new Response(
      JSON.stringify({ error: "chatflowId and question are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  const client = getFlowiseClient()
  try {
    const result = await client.createPrediction({
      chatflowId,
      question,
      history,
      overrideConfig,
      streaming,
    })

    if (streaming && result && typeof (result as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] === "function") {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result as AsyncGenerator<{ event?: string; data?: string }>) {
              const line = `data: ${JSON.stringify(chunk)}\n\n`
              controller.enqueue(new TextEncoder().encode(line))
            }
            controller.close()
          } catch (e) {
            controller.error(e)
          }
        },
      })
      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      })
    }

    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(
      JSON.stringify({ error: "Prediction failed", detail: message }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    )
  }
}
