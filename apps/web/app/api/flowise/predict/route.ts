import { createClient } from "@/lib/supabase/server"
import { createAdminClient, getSupabaseConfigMissing } from "@/lib/supabase/admin"
import { getFlowiseClient } from "@/lib/flowise/client"
import { decryptFlowiseApiKey } from "@/lib/flowise/profile-api-key"
import { getIdempotencySeen, setIdempotencyKey, sessionMetadataSet } from "@/lib/redis"

/** Predict endpoint forwards to Flowise; see temp/flowise-api-upgraded.json for high-level Flowise REST API. */
export const maxDuration = 60

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

  const client = getFlowiseClient(userApiKey)
  try {
    const result = await client.createPrediction({
      chatflowId,
      question,
      history,
      overrideConfig: Object.keys(mergedOverrideConfig).length > 0 ? mergedOverrideConfig : undefined,
      streaming,
      ...(uploads && uploads.length > 0 ? { uploads } : {}),
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
      if (sessionId?.trim()) {
        await sessionMetadataSet(sessionId.trim(), "lastRequestAt", Date.now())
      }
      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      })
    }

    if (sessionId?.trim()) {
      await sessionMetadataSet(sessionId.trim(), "lastRequestAt", Date.now())
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
