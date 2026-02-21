import { createClient } from "@/lib/supabase/server"
import { createAdminClient, getSupabaseConfigMissing } from "@/lib/supabase/admin"
import { getFlowiseClient, flowiseFetch } from "@/lib/flowise/client"
import { decryptFlowiseApiKey } from "@/lib/flowise/profile-api-key"
import { getIdempotencySeen, setIdempotencyKey, sessionMetadataSet } from "@/lib/redis"
import { checkRateLimit } from "@/lib/rate-limit"

const MAX_QUESTION_LENGTH = 32_000
const MAX_BODY_BYTES = 1024 * 1024
const CHAT_LOG_PREVIEW_LENGTH = 500

/**
 * Read request body as text up to maxBytes. Throws Error("BODY_TOO_LARGE") if body exceeds limit.
 */
async function readBodyWithLimit(request: Request, maxBytes: number): Promise<string> {
  const contentLength = request.headers.get("content-length")
  if (contentLength) {
    const len = parseInt(contentLength, 10)
    if (!Number.isNaN(len) && len > maxBytes) throw new Error("BODY_TOO_LARGE")
  }
  const reader = request.body?.getReader()
  if (!reader) return ""
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.length
      if (total > maxBytes) throw new Error("BODY_TOO_LARGE")
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.length
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(out)
}

/**
 * Flowise can send SSE in two ways:
 * 1. Data-only: data: {"event":"token","data":"Hel"} (JSON in data line)
 * 2. Event + data: event: token\n data: Hel (plain text in data line)
 * We always re-emit as data: {"event":"X","data":Y}\n\n so the client gets a single JSON shape.
 */
function normalizeFlowiseSSEToJSON(
  readable: ReadableStream<Uint8Array>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  let buffer = ""
  let currentEvent: string | null = null

  return new ReadableStream({
    async start(controller) {
      const reader = readable.getReader()
      const decoder = new TextDecoder("utf-8", { fatal: false })
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue
            if (trimmed.startsWith("event:")) {
              currentEvent = trimmed.slice(6).trim()
              continue
            }
            if (trimmed.startsWith("data:")) {
              const rawData = trimmed.slice(5).trim()
              const fallbackEvent = currentEvent ?? "token"
              currentEvent = null

              if (rawData === "[DONE]") {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: "end", data: "[DONE]" })}\n\n`))
                continue
              }
              const payloads: { event: string; data: string | unknown }[] = []
              try {
                const single = JSON.parse(rawData) as unknown
                if (typeof single === "object" && single !== null && "event" in (single as object)) {
                  const obj = single as { event: string; data?: unknown }
                  payloads.push({ event: String(obj.event), data: obj.data })
                } else {
                  payloads.push({ event: fallbackEvent, data: single })
                }
              } catch {
                const parts = rawData.split("}{")
                for (let i = 0; i < parts.length; i += 1) {
                  const wrapped = i === 0 ? parts[i] + "}" : i === parts.length - 1 ? "{" + parts[i]! : "{" + parts[i] + "}"
                  try {
                    const parsed = JSON.parse(wrapped) as unknown
                    if (typeof parsed === "object" && parsed !== null && "event" in (parsed as object)) {
                      const obj = parsed as { event: string; data?: unknown }
                      payloads.push({ event: String(obj.event), data: obj.data })
                    } else {
                      payloads.push({ event: fallbackEvent, data: parsed })
                    }
                  } catch {
                    payloads.push({ event: fallbackEvent, data: wrapped })
                  }
                }
                if (payloads.length === 0) payloads.push({ event: fallbackEvent, data: rawData })
              }
              for (const chunk of payloads) {
                if (process.env.FLOWISE_SSE_DEBUG === "true") {
                  // eslint-disable-next-line no-console
                  console.debug("[flowise-sse]", chunk.event, typeof chunk.data === "string" ? chunk.data?.slice(0, 100) : chunk.data)
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
              }
            }
          }
        }
        reader.releaseLock()
        controller.close()
      } catch (e) {
        controller.error(e)
      }
    },
  })
}

export interface PredictBody {
  chatflowId: string
  question: string
  history?: Array<{ message: string; type: string }>
  overrideConfig?: Record<string, unknown>
  streaming?: boolean
  uploads?: Array<{ data?: string; type: string; name: string; mime: string }>
  idempotencyKey?: string
  sessionId?: string
}

function jsonResponse(body: unknown, status: number, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...init?.headers },
  })
}

/** Extract first 500 chars of assistant text from Flowise non-streaming result. */
function extractResponsePreview(result: Record<string, unknown>): string {
  let text = ""
  if (typeof result.text === "string") text = result.text
  else if (typeof result.data === "string") text = result.data
  else if (result.message && typeof (result.message as Record<string, unknown>).text === "string")
    text = (result.message as { text: string }).text
  else if (typeof result.result === "string") text = result.result
  else if (typeof result.answer === "string") text = result.answer
  else if (typeof result.output === "string") text = result.output
  else if (typeof result.response === "string") text = result.response
  return text.slice(0, CHAT_LOG_PREVIEW_LENGTH)
}

/** Count tool calls from result if present. */
function countToolCalls(result: Record<string, unknown>): number | null {
  const usedTools = result.usedTools ?? result.toolCalls ?? result.tools
  if (Array.isArray(usedTools)) return usedTools.length
  return null
}

/**
 * Shared Flowise predict handler. Used by POST /api/flowise/predict and POST /api/chat/flowise.
 * Enforces rate limit, input limits, and optional audit logging.
 */
export async function handleFlowisePredict(request: Request): Promise<Response> {
  const startTime = Date.now()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return jsonResponse({ error: "Unauthorized" }, 401)
  }

  const rateLimit = await checkRateLimit(`flowise:predict:${user.id}`)
  if (!rateLimit.ok) {
    return jsonResponse(
      { error: "Too many requests", retryAfter: rateLimit.reset },
      429,
      { headers: { "Retry-After": String(Math.ceil((rateLimit.reset - Date.now()) / 1000)) } }
    )
  }

  let body: PredictBody
  try {
    const raw = await readBodyWithLimit(request, MAX_BODY_BYTES)
    body = raw ? (JSON.parse(raw) as PredictBody) : ({} as PredictBody)
  } catch (e) {
    if (e instanceof Error && e.message === "BODY_TOO_LARGE") {
      return jsonResponse({ error: "Request body too large", maxBytes: MAX_BODY_BYTES }, 413)
    }
    return jsonResponse({ error: "Invalid JSON" }, 400)
  }

  const { chatflowId, question, history, overrideConfig: bodyOverrides, streaming = false, uploads, idempotencyKey, sessionId } = body
  if (!chatflowId || typeof question !== "string") {
    return jsonResponse({ error: "chatflowId and question are required" }, 400)
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    return jsonResponse(
      { error: "Question too long", maxLength: MAX_QUESTION_LENGTH },
      400
    )
  }

  if (idempotencyKey?.trim()) {
    const idemKey = `flowise:predict:${user.id}:${idempotencyKey.trim()}`
    if (await getIdempotencySeen(idemKey)) {
      return jsonResponse(
        { error: "Duplicate request", detail: "This idempotency key was already used." },
        409
      )
    }
    await setIdempotencyKey(idemKey)
  }

  const supabaseMissing = getSupabaseConfigMissing()
  let mergedOverrideConfig: Record<string, unknown> = { ...(bodyOverrides ?? {}) }
  let userApiKey: string | null = null

  if (!supabaseMissing) {
    const admin = createAdminClient()
    const [assignmentRes, profileRes, userStoreRes] = await Promise.all([
      admin
        .from("flowise_chatflow_assignments")
        .select("override_config")
        .eq("profile_id", user.id)
        .eq("chatflow_id", chatflowId)
        .maybeSingle(),
      admin
        .from("profiles")
        .select("flowise_api_key_encrypted")
        .eq("id", user.id)
        .single(),
      admin
        .from("flowise_user_document_stores")
        .select("flowise_store_id")
        .eq("profile_id", user.id)
        .eq("scope", "dojo")
        .maybeSingle(),
    ])

    const assignmentOverrides = (assignmentRes.data?.override_config as Record<string, unknown> | null) ?? {}
    mergedOverrideConfig = { ...assignmentOverrides, ...(bodyOverrides ?? {}) }
    if (userStoreRes.data?.flowise_store_id) {
      mergedOverrideConfig.documentStoreId = userStoreRes.data.flowise_store_id
    }
    if (!("supabaseMetadataFilter" in mergedOverrideConfig)) {
      mergedOverrideConfig.supabaseMetadataFilter = { profile_id: user.id }
    }

    if (profileRes.data?.flowise_api_key_encrypted) {
      try {
        userApiKey = decryptFlowiseApiKey(profileRes.data.flowise_api_key_encrypted)
      } catch {
        // use system key
      }
    }
  }

  const flowiseApiKey = userApiKey ?? process.env.FLOWISE_API_KEY
  if (!flowiseApiKey?.trim()) {
    return jsonResponse(
      {
        error:
          "Flowise API key not configured. Set FLOWISE_API_KEY in .env.local (or Vercel env) to a valid key from Flowise (Settings → API Keys) and assign it to this chatflow.",
      },
      503
    )
  }

  const effectiveSessionId =
    typeof sessionId === "string"
      ? sessionId.trim() || undefined
      : typeof mergedOverrideConfig.sessionId === "string"
        ? (mergedOverrideConfig.sessionId as string).trim() || undefined
        : undefined

  const client = getFlowiseClient(userApiKey)
  const predictionPayload = {
    chatflowId,
    question,
    history,
    overrideConfig: Object.keys(mergedOverrideConfig).length > 0 ? mergedOverrideConfig : undefined,
    ...(uploads && uploads.length > 0 ? { uploads } : {}),
  }

  const logInsert = async (opts: {
    responsePreview: string
    toolCallsCount: number | null
  }) => {
    if (supabaseMissing) return
    const latencyMs = Date.now() - startTime
    const promptPreview = question.slice(0, CHAT_LOG_PREVIEW_LENGTH) || null
    try {
      await supabase.from("flowise_chat_logs").insert({
        profile_id: user.id,
        session_id: effectiveSessionId ?? null,
        chatflow_id: chatflowId,
        prompt_preview: promptPreview,
        response_preview: opts.responsePreview,
        tool_calls_count: opts.toolCallsCount,
        latency_ms: latencyMs,
      })
    } catch {
      // best-effort; do not fail the request
    }
  }

  try {
    if (streaming) {
      const res = await flowiseFetch(
        `prediction/${chatflowId}`,
        {
          method: "POST",
          body: { ...predictionPayload, streaming: true },
        },
        userApiKey
      )
      if (!res.ok) {
        const text = await res.text()
        throw new Error(res.status === 401 ? "Unauthorized" : text || `Flowise ${res.status}`)
      }
      const bodyStream = res.body
      if (!bodyStream) throw new Error("Flowise returned no body")
      const stream = normalizeFlowiseSSEToJSON(bodyStream)
      if (effectiveSessionId) {
        await sessionMetadataSet(effectiveSessionId, "lastRequestAt", Date.now())
      }
      void logInsert({ responsePreview: "[streamed]", toolCallsCount: null })
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-store, no-transform",
          "X-Accel-Buffering": "no",
        },
      })
    }

    const result = await client.createPrediction({
      ...predictionPayload,
      streaming: false,
    }) as Record<string, unknown>

    if (effectiveSessionId) {
      await sessionMetadataSet(effectiveSessionId, "lastRequestAt", Date.now())
    }

    const responsePreview = extractResponsePreview(result)
    const toolCallsCount = countToolCalls(result)
    void logInsert({
      responsePreview: responsePreview || "[empty]",
      toolCallsCount,
    })

    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    const isUnauthorized =
      typeof message === "string" &&
      (message.includes("Unauthorized") || message.includes("buildChatflow"))
    const hint = isUnauthorized
      ? " Ensure FLOWISE_API_KEY is set to a key created in Flowise (Settings → API Keys) and that the key is assigned to this chatflow."
      : ""
    return jsonResponse(
      { error: "Prediction failed", detail: message + hint },
      502
    )
  }
}
