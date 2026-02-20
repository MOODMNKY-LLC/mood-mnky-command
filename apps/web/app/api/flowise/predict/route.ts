import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getFlowiseClient } from "@/lib/flowise/client"
import { decryptFlowiseApiKey } from "@/lib/flowise/profile-api-key"

/** Predict endpoint forwards to Flowise; see temp/flowise-api-upgraded.json for high-level Flowise REST API. */
export const maxDuration = 60

interface PredictBody {
  chatflowId: string
  question: string
  history?: Array<{ message: string; type: string }>
  overrideConfig?: Record<string, unknown>
  streaming?: boolean
  uploads?: Array<{ data?: string; type: string; name: string; mime: string }>
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

  const { chatflowId, question, history, overrideConfig: bodyOverrides, streaming = false, uploads } = body
  if (!chatflowId || typeof question !== "string") {
    return new Response(
      JSON.stringify({ error: "chatflowId and question are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  const admin = createAdminClient()
  const [assignmentRes, profileRes] = await Promise.all([
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
  ])

  const assignmentOverrides = (assignmentRes.data?.override_config as Record<string, unknown> | null) ?? {}
  const mergedOverrideConfig = { ...assignmentOverrides, ...(bodyOverrides ?? {}) }

  let userApiKey: string | null = null
  if (profileRes.data?.flowise_api_key_encrypted) {
    try {
      userApiKey = decryptFlowiseApiKey(profileRes.data.flowise_api_key_encrypted)
    } catch {
      // use system key
    }
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
