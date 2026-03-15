/**
 * POST /api/chat/run
 * BFF proxy: receives messages from the client, calls Flowise prediction,
 * and streams the SSE response back. Flowise API key never leaves the server.
 *
 * Body: { chatflowId, question, chatId?, history?, overrideConfig?, uploads? }
 *
 * overrideConfig is passed to Flowise prediction API. Flowise applies it to the
 * run (e.g. overrides node inputs by name). We send:
 * - systemMessage: optional custom system instructions
 * - vars.agentMode: 'default' | 'coder' (when 'coder', Context7 docs are injected)
 * - vars.modelOverride: selected model id for ChatOpenAI-style nodes
 * - vars.enabledTools: array of tool ids the flow may use to filter/enable tools
 * The chatflow must be built to read these vars (or Flowise must map them to node inputs).
 *
 * Agent flows (e.g. code-mnky) often report isStreaming: false and return a buffered
 * JSON response; we use the fetch-based stream and convert JSON to SSE so both
 * streaming and non-streaming chatflows work.
 */
import { getChatflowStreamingStatus, streamPrediction, streamPredictionWithSDK, syncPrediction } from '@/lib/flowise/client'
import type { FlowisePredictionPayload } from '@/lib/flowise/client'
import { requireUser } from '@/lib/auth/require-user'
import { injectContext7IntoOverrideConfig } from '@/lib/chat/context7-inject'
import { extractMessageText } from '@/lib/chat/parse-flowise-response'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseConfigMissing } from '@/lib/supabase/admin'

const CHAT_LOG_PREVIEW_LENGTH = 500

function countToolCalls(result: Record<string, unknown>): number | null {
  const usedTools = result.usedTools ?? result.toolCalls ?? result.tools
  if (Array.isArray(usedTools)) return usedTools.length
  const agentReasoning = result.agentReasoning
  if (Array.isArray(agentReasoning)) {
    const total = agentReasoning.reduce(
      (acc, r) => acc + (Array.isArray((r as Record<string, unknown>).usedTools) ? (r as Record<string, unknown>).usedTools!.length : 0),
      0
    )
    return total > 0 ? total : null
  }
  return null
}

export const maxDuration = 60

export async function POST(req: Request) {
  const auth = await requireUser()
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }

  const body = await req.json() as {
    chatflowId: string
    question: string
    chatId?: string
    streaming?: boolean
    history?: FlowisePredictionPayload['history']
    overrideConfig?: FlowisePredictionPayload['overrideConfig']
    uploads?: FlowisePredictionPayload['uploads']
  }

  const { chatflowId, question, chatId, streaming = true, history, overrideConfig: rawOverrideConfig, uploads } = body

  const hasQuestion = Boolean(question?.trim())
  const hasUploads = Boolean(uploads?.length)
  if (!chatflowId || (!hasQuestion && !hasUploads)) {
    return Response.json(
      { error: 'chatflowId and either question or uploads are required' },
      { status: 400 }
    )
  }

  const agentMode = (rawOverrideConfig?.vars as Record<string, unknown> | undefined)?.agentMode as string | undefined
  let overrideConfig = await injectContext7IntoOverrideConfig({
    overrideConfig: rawOverrideConfig as Record<string, unknown> | undefined,
    agentMode,
  })
  // Pass Supabase user context so flows/tools can use it (e.g. per-user RAG, audit).
  const vars = { ...((overrideConfig?.vars as Record<string, unknown>) ?? {}), profile_id: auth.userId }
  overrideConfig = { ...overrideConfig, vars }

  // Per-user RAG: supabaseMetadataFilter for Supabase vector store; optional documentStoreId from assignments.
  if (!('supabaseMetadataFilter' in (overrideConfig ?? {}))) {
    overrideConfig = { ...overrideConfig, supabaseMetadataFilter: { profile_id: auth.userId } }
  }
  try {
    const supabase = await createClient()
    const { data: assignment } = await supabase
      .from('flowise_user_document_stores')
      .select('flowise_store_id')
      .eq('profile_id', auth.userId)
      .order('scope')
      .limit(1)
      .maybeSingle()
    if (assignment?.flowise_store_id && !('documentStoreId' in (overrideConfig ?? {}))) {
      overrideConfig = { ...overrideConfig, documentStoreId: assignment.flowise_store_id }
    }
  } catch {
    // Best-effort: do not fail predict if assignments table or query fails
  }

  // Flowise requires a non-empty question; use placeholder when only uploads are sent
  const questionForFlowise = question?.trim() || (hasUploads ? 'Describe the attached file(s).' : '')

  const payload: FlowisePredictionPayload = {
    question: questionForFlowise,
    ...(chatId ? { chatId } : {}),
    ...(history?.length ? { history } : {}),
    ...(overrideConfig ? { overrideConfig } : {}),
    ...(uploads?.length ? { uploads } : {}),
  }

  const startTime = Date.now()
  const logInsert = async (opts: { responsePreview: string; toolCallsCount: number | null }) => {
    if (getSupabaseConfigMissing()) return
    const latencyMs = Date.now() - startTime
    const promptPreview = questionForFlowise.slice(0, CHAT_LOG_PREVIEW_LENGTH) || null
    try {
      const supabase = await createClient()
      await supabase.from('flowise_chat_logs').insert({
        profile_id: auth.userId,
        session_id: chatId ?? null,
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
      const headers = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      }
      const status = await getChatflowStreamingStatus(chatflowId)
      const useSdkStream = status.ok && status.isStreaming === true
      if (useSdkStream) {
        try {
          const stream = await streamPredictionWithSDK(chatflowId, payload)
          void logInsert({ responsePreview: '[streamed]', toolCallsCount: null })
          return new Response(stream, { headers })
        } catch (sdkErr) {
          console.warn('[api/chat/run] SDK stream failed, falling back to fetch:', sdkErr instanceof Error ? sdkErr.message : sdkErr)
        }
      }
      const stream = await streamPrediction(chatflowId, payload)
      void logInsert({ responsePreview: '[streamed]', toolCallsCount: null })
      return new Response(stream, { headers })
    }

    const result = await syncPrediction(chatflowId, payload)
    const extracted = extractMessageText(result as unknown)
    if (!extracted?.trim()) {
      const preview = JSON.stringify(result).slice(0, 600)
      console.warn('[flow-mnky:no-response] syncPrediction returned but extractMessageText was empty. Keys:', Object.keys(result as Record<string, unknown>), 'Preview:', preview)
    }
    const responsePreview = extracted.trim().slice(0, CHAT_LOG_PREVIEW_LENGTH) || '[empty]'
    const toolCallsCount = countToolCalls(result as Record<string, unknown>)
    void logInsert({ responsePreview, toolCallsCount })
    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Prediction failed'
    console.error('[api/chat/run]', message, err)
    return Response.json({ error: message }, { status: 502 })
  }
}
