import { createClient } from "@/lib/supabase/server"
import { createAdminClient, getSupabaseConfigMissing } from "@/lib/supabase/admin"
import { getFlowiseClient, flowiseFetch } from "@/lib/flowise/client"
import { decryptFlowiseApiKey } from "@/lib/flowise/profile-api-key"
import { getIdempotencySeen, setIdempotencyKey, sessionMetadataSet } from "@/lib/redis"

/** Predict endpoint forwards to Flowise; see temp/flowise-api-upgraded.json for high-level Flowise REST API. */
export const maxDuration = 60

/**
 * Flowise sends SSE as "event: X" then "data: Y" (Y may be plain text). We re-emit as
 * data: {"event":"X","data":"Y"}\n\n so the client parser (expecting JSON in data:) works.
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
      const decoder = new TextDecoder()
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
              const data = trimmed.slice(5).trim()
              const event = currentEvent ?? "token"
              currentEvent = null
              if (process.env.FLOWISE_SSE_DEBUG === "true") {
                // eslint-disable-next-line no-console
                console.debug("[flowise-sse]", event, data?.slice(0, 100))
              }
              const chunk = { event, data }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
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

interface PredictBody {
  chatflowId: string
  question: string
  history?: Array<{ message: string; type: string }>
  overrideConfig?: Record<string, unknown>
  streaming?: boolean
  uploads?: Array<{ data?: string; type: string; name: string; mime: string }>
  /** Optional idempotency key; duplicate requests with same key within 24h return 409. */
  idempotencyKey?: string
  /** Optional chat session id; when set, lastRequestAt is stored in Redis for this session (1h TTL). */
  sessionId?: string
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

  const { chatflowId, question, history, overrideConfig: bodyOverrides, streaming = false, uploads, idempotencyKey, sessionId } = body
  if (!chatflowId || typeof question !== "string") {
    return new Response(
      JSON.stringify({ error: "chatflowId and question are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  if (idempotencyKey?.trim()) {
    const idemKey = `flowise:predict:${user.id}:${idempotencyKey.trim()}`
    if (await getIdempotencySeen(idemKey)) {
      return new Response(
        JSON.stringify({ error: "Duplicate request", detail: "This idempotency key was already used." }),
        { status: 409, headers: { "Content-Type": "application/json" } },
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
    // When using Supabase vector store, inject profile_id filter for per-user RAG unless explicitly overridden
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
    return new Response(
      JSON.stringify({
        error:
          "Flowise API key not configured. Set FLOWISE_API_KEY in .env.local (or Vercel env) to a valid key from Flowise (Settings → API Keys) and assign it to this chatflow.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    )
  }

  // Use sessionId from body or from overrideConfig (Dojo sends it in overrideConfig for Flowise memory)
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

  try {
    // Fix 2: When client requests streaming, bypass SDK (broken SSE parsing) and proxy Flowise stream,
    // normalizing event/data lines to data: {"event","data"} so the client parser works.
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
      const body = res.body
      if (!body) throw new Error("Flowise returned no body")
      const stream = normalizeFlowiseSSEToJSON(body)
      if (effectiveSessionId) {
        await sessionMetadataSet(effectiveSessionId, "lastRequestAt", Date.now())
      }
      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      })
    }

    // Fix 1 / non-streaming: use SDK with streaming: false so we get a single JSON response.
    const result = await client.createPrediction({
      ...predictionPayload,
      streaming: false,
    })

    if (effectiveSessionId) {
      await sessionMetadataSet(effectiveSessionId, "lastRequestAt", Date.now())
    }
    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    const isUnauthorized =
      typeof message === "string" &&
      (message.includes("Unauthorized") || message.includes("buildChatflow"))
    const hint = isUnauthorized
      ? " Ensure FLOWISE_API_KEY is set to a key created in Flowise (Settings → API Keys) and that the key is assigned to this chatflow."
      : ""
    return new Response(
      JSON.stringify({
        error: "Prediction failed",
        detail: message + hint,
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    )
  }
}
