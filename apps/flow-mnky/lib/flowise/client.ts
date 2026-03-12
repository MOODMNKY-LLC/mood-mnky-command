/**
 * Flowise BFF Client
 * All calls to Flowise happen server-side through this module.
 * API keys are never exposed to the browser.
 */

import { FlowiseClient } from 'flowise-sdk'

export interface FlowiseChatflow {
  id: string
  name: string
  description?: string
  flowData?: string
  isPublic: boolean
  deployed?: boolean
  apikeyid?: string
  chatbotConfig?: string
  apiConfig?: string
  category?: string
  type?: 'CHATFLOW' | 'MULTIAGENT'
  createdDate?: string
  updatedDate?: string
}

export interface FlowiseAssistant {
  id: string
  details: string // JSON string containing name, description, instructions, model, tools
  iconSrc?: string
  createdDate?: string
  updatedDate?: string
}

export interface FlowiseVariable {
  id: string
  name: string
  value: string
  type: 'string' | 'number' | 'boolean' | 'json'
  createdDate?: string
  updatedDate?: string
}

export interface FlowiseDocumentStore {
  id: string
  name: string
  description?: string
  loaders?: string // JSON
  whereUsed?: string // JSON
  createdDate?: string
  updatedDate?: string
  status?: 'EMPTY' | 'SYNC' | 'SYNCING' | 'STALE' | 'NEW'
  vectorStoreConfig?: string
  embeddingConfig?: string
  recordManagerConfig?: string
}

export interface FlowiseChatMessage {
  id: string
  role: 'userMessage' | 'apiMessage'
  content: string
  chatId: string
  chatflowid: string
  createdDate?: string
  sourceDocuments?: string // JSON
  usedTools?: string // JSON
  fileAnnotations?: string // JSON
  agentReasoning?: string // JSON
  action?: string // JSON
  sessionId?: string
  memType?: string
  leadEmail?: string
}

export interface FlowisePredictionPayload {
  question: string
  chatId?: string
  streaming?: boolean
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
  overrideConfig?: Record<string, unknown>
  uploads?: Array<{ data: string; type: string; name: string; mime: string }>
}

export interface FlowisePredictionResult {
  text: string
  question?: string
  chatId?: string
  chatMessageId?: string
  sessionId?: string
  memoryType?: string
  sourceDocuments?: Array<{
    pageContent: string
    metadata: Record<string, unknown>
  }>
  usedTools?: Array<{ tool: string; toolInput: unknown; toolOutput: unknown }>
  agentReasoning?: Array<{ agentName: string; messages: string[]; instructions?: string; usedTools?: unknown[]; sourceDocuments?: unknown[] }>
}

export interface FlowisePingResult {
  status: 'healthy' | 'unreachable' | 'unauthorized'
  latencyMs?: number
  version?: string
  /** When status is unreachable, the underlying error message for debugging. */
  error?: string
}

function getFlowiseConfig() {
  // Prefer FLOWISE_HOST_URL (flow-mnky/.env.local); then FLOWISE_BASE_URL / NEXT_PUBLIC_* (root .env.local).
  // Turbo only passes vars in globalPassThroughEnv (see turbo.json) — FLOWISE_HOST_URL and FLOWISE_BASE_URL are listed.
  const hostUrl =
    process.env.FLOWISE_HOST_URL?.trim() ||
    process.env.FLOWISE_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_FLOWISE_HOST?.trim()
  const apiKey = process.env.FLOWISE_API_KEY?.trim()

  if (!hostUrl || !apiKey) {
    throw new Error(
      'FLOWISE_HOST_URL (or FLOWISE_BASE_URL or NEXT_PUBLIC_FLOWISE_HOST) and FLOWISE_API_KEY must be set. ' +
        'Set in apps/flow-mnky/.env.local or root .env.local. When using pnpm dev from root, turbo passes FLOWISE_* from root .env.local (see turbo.json globalPassThroughEnv).'
    )
  }

  const baseUrl = `${hostUrl.replace(/\/$/, '')}/api/v1`
  const sdkBaseUrl = baseUrl.replace(/\/api\/v1\/?$/, '') || baseUrl
  return {
    baseUrl,
    apiKey,
    sdkBaseUrl,
  }
}

async function flowiseFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { baseUrl, apiKey } = getFlowiseConfig()
  const url = `${baseUrl}${path}`

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText)
    throw new Error(`Flowise ${res.status}: ${body}`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json() as Promise<T>
  }
  return res.text() as unknown as Promise<T>
}

/** POST with FormData (e.g. multipart file upload). Do not set Content-Type so fetch sets boundary. */
async function flowiseFetchFormData<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const { baseUrl, apiKey } = getFlowiseConfig()
  const url = `${baseUrl}${path}`

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText)
    throw new Error(`Flowise ${res.status}: ${body}`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json() as Promise<T>
  }
  return res.text() as unknown as Promise<T>
}

export interface VectorUpsertResponse {
  numAdded?: number
  numDeleted?: number
  numUpdated?: number
  numSkipped?: number
  addedDocs?: Array<{ pageContent: string; metadata: Record<string, unknown> }>
}

// ── Ping ──────────────────────────────────────────────────────────────────────
const PING_TIMEOUT_MS = 15_000

export async function pingFlowise(): Promise<FlowisePingResult> {
  const start = Date.now()
  try {
    const { baseUrl, apiKey } = getFlowiseConfig()
    const url = `${baseUrl}/chatflows`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(PING_TIMEOUT_MS),
    })
    const latencyMs = Date.now() - start
    if (res.status === 401) {
      return { status: 'unauthorized', latencyMs, error: 'Flowise returned 401. Check FLOWISE_API_KEY (use a valid JWT or app API key).' }
    }
    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText)
      return {
        status: 'unreachable',
        latencyMs,
        error: `Flowise returned ${res.status}: ${body.slice(0, 200)}`,
      }
    }
    return { status: 'healthy', latencyMs }
  } catch (err) {
    const latencyMs = Date.now() - start
    const message = err instanceof Error ? err.message : String(err)
    return {
      status: 'unreachable',
      latencyMs,
      error: message,
    }
  }
}

// ── Chatflows ─────────────────────────────────────────────────────────────────
export async function listChatflows(): Promise<FlowiseChatflow[]> {
  return flowiseFetch<FlowiseChatflow[]>('/chatflows')
}

export async function getChatflow(id: string): Promise<FlowiseChatflow> {
  return flowiseFetch<FlowiseChatflow>(`/chatflows/${id}`)
}

export async function createChatflow(data: Partial<FlowiseChatflow>): Promise<FlowiseChatflow> {
  return flowiseFetch<FlowiseChatflow>('/chatflows', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateChatflow(id: string, data: Partial<FlowiseChatflow>): Promise<FlowiseChatflow> {
  return flowiseFetch<FlowiseChatflow>(`/chatflows/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteChatflow(id: string): Promise<void> {
  return flowiseFetch<void>(`/chatflows/${id}`, { method: 'DELETE' })
}

// ── Assistants ────────────────────────────────────────────────────────────────
export async function listAssistants(): Promise<FlowiseAssistant[]> {
  return flowiseFetch<FlowiseAssistant[]>('/assistants')
}

export async function getAssistant(id: string): Promise<FlowiseAssistant> {
  return flowiseFetch<FlowiseAssistant>(`/assistants/${id}`)
}

export async function createAssistant(data: { details: string; iconSrc?: string }): Promise<FlowiseAssistant> {
  return flowiseFetch<FlowiseAssistant>('/assistants', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateAssistant(id: string, data: { details: string; iconSrc?: string }): Promise<FlowiseAssistant> {
  return flowiseFetch<FlowiseAssistant>(`/assistants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteAssistant(id: string): Promise<void> {
  return flowiseFetch<void>(`/assistants/${id}`, { method: 'DELETE' })
}

// ── Variables ─────────────────────────────────────────────────────────────────
export async function listVariables(): Promise<FlowiseVariable[]> {
  return flowiseFetch<FlowiseVariable[]>('/variables')
}

export async function createVariable(data: Omit<FlowiseVariable, 'id' | 'createdDate' | 'updatedDate'>): Promise<FlowiseVariable> {
  return flowiseFetch<FlowiseVariable>('/variables', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateVariable(id: string, data: Partial<FlowiseVariable>): Promise<FlowiseVariable> {
  return flowiseFetch<FlowiseVariable>(`/variables/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteVariable(id: string): Promise<void> {
  return flowiseFetch<void>(`/variables/${id}`, { method: 'DELETE' })
}

// ── Document Stores ───────────────────────────────────────────────────────────
export async function listDocumentStores(): Promise<FlowiseDocumentStore[]> {
  return flowiseFetch<FlowiseDocumentStore[]>('/document-store/store')
}

export async function getDocumentStore(id: string): Promise<FlowiseDocumentStore> {
  return flowiseFetch<FlowiseDocumentStore>(`/document-store/store/${id}`)
}

export async function createDocumentStore(data: { name: string; description?: string }): Promise<FlowiseDocumentStore> {
  return flowiseFetch<FlowiseDocumentStore>('/document-store/store', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteDocumentStore(id: string): Promise<void> {
  return flowiseFetch<void>(`/document-store/store/${id}`, { method: 'DELETE' })
}

/**
 * Upsert files into a document store (vector ingestion).
 * POST /document-store/upsert/{id} with multipart/form-data; formData must include "files".
 */
export async function upsertDocumentStoreFiles(
  storeId: string,
  formData: FormData,
): Promise<VectorUpsertResponse> {
  return flowiseFetchFormData<VectorUpsertResponse>(
    `/document-store/upsert/${storeId}`,
    formData,
  )
}

// ── Chat Messages ─────────────────────────────────────────────────────────────
export async function getChatMessages(params: {
  chatflowId?: string
  chatId?: string
  sessionId?: string
  memoryType?: string
  sort?: 'ASC' | 'DESC'
  startDate?: string
  endDate?: string
  feedback?: boolean
}): Promise<FlowiseChatMessage[]> {
  const qs = new URLSearchParams()
  if (params.chatflowId) qs.set('chatflowid', params.chatflowId)
  if (params.chatId) qs.set('chatId', params.chatId)
  if (params.sessionId) qs.set('sessionId', params.sessionId)
  if (params.memoryType) qs.set('memoryType', params.memoryType)
  if (params.sort) qs.set('sort', params.sort)
  if (params.startDate) qs.set('startDate', params.startDate)
  if (params.endDate) qs.set('endDate', params.endDate)
  if (params.feedback !== undefined) qs.set('feedback', String(params.feedback))
  return flowiseFetch<FlowiseChatMessage[]>(`/chatmessage/${params.chatflowId || ''}?${qs}`)
}

export async function deleteChatMessages(chatflowId: string, params?: { sessionId?: string; memoryType?: string }): Promise<void> {
  const qs = new URLSearchParams()
  if (params?.sessionId) qs.set('sessionId', params.sessionId)
  if (params?.memoryType) qs.set('memoryType', params.memoryType)
  return flowiseFetch<void>(`/chatmessage/${chatflowId}?${qs}`, { method: 'DELETE' })
}

// ── Prediction ────────────────────────────────────────────────────────────────

/**
 * Call Flowise GET /api/v1/chatflows-streaming/:id (with auth).
 * The SDK uses this to decide if it returns a stream; it does not send the API key.
 * Use this to see why the SDK might not be streaming.
 *
 * Note: Agent flows (especially sequential agents) often report isStreamValid: false
 * or buffer the full response; chain-style chatflows typically support token streaming.
 * See Flowise docs (Agentflow V2 vs chain) and GitHub #4014, #4926.
 */
export async function getChatflowStreamingStatus(chatflowId: string): Promise<{
  ok: boolean
  status: number
  isStreaming?: boolean
  body?: unknown
  error?: string
}> {
  const { sdkBaseUrl, apiKey } = getFlowiseConfig()
  const url = `${sdkBaseUrl}/api/v1/chatflows-streaming/${chatflowId}`
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
      },
    })
    const body = await res.json().catch(() => ({}))
    const isStreaming = Boolean((body as { isStreaming?: boolean }).isStreaming)
    return { ok: res.ok, status: res.status, isStreaming, body }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/** Stream using flowise-sdk; yields one SSE message per token so the client gets true streaming. */
export async function streamPredictionWithSDK(
  chatflowId: string,
  payload: FlowisePredictionPayload,
): Promise<ReadableStream<Uint8Array>> {
  const { sdkBaseUrl, apiKey } = getFlowiseConfig()
  const client = new FlowiseClient({
    baseUrl: sdkBaseUrl,
    apiKey,
  } as { baseUrl: string; apiKey?: string })

  const encoder = new TextEncoder()
  const prediction = await client.createPrediction({
    chatflowId,
    question: payload.question,
    streaming: true,
    ...(payload.chatId && { chatId: payload.chatId }),
    ...(payload.history?.length && {
      history: payload.history.map((m) => ({
        message: m.content,
        type: m.role === 'user' ? ('userMessage' as const) : ('apiMessage' as const),
      })),
    }),
    ...(payload.uploads?.length && { uploads: payload.uploads }),
  })
  if (typeof (prediction as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] !== 'function') {
    const status = await getChatflowStreamingStatus(chatflowId)
    console.warn(
      '[flowise] chatflows-streaming check:',
      JSON.stringify({
        chatflowId,
        status: status.status,
        ok: status.ok,
        isStreaming: status.isStreaming,
        body: status.body,
        error: status.error,
      })
    )
    throw new Error(
      status.error
        ? `Flowise SDK stream check failed: ${status.error}`
        : status.ok && status.isStreaming === false
          ? 'Flowise reports isStreaming: false for this chatflow'
          : !status.ok
            ? `Flowise chatflows-streaming returned ${status.status}`
            : 'Flowise SDK did not return a stream (chatflow may not support streaming)'
    )
  }
  const iterable = prediction as AsyncGenerator<{ event?: string; data?: string }>
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of iterable) {
          const event = chunk.event ?? 'token'
          const data = chunk.data ?? ''
          const dataStr = typeof data === 'string' ? JSON.stringify(data) : JSON.stringify(data)
          const line = `event: ${event}\ndata: ${dataStr}\n\n`
          controller.enqueue(encoder.encode(line))
        }
      } catch (err) {
        controller.error(err)
      } finally {
        controller.close()
      }
    },
  })
}

export async function streamPrediction(
  chatflowId: string,
  payload: FlowisePredictionPayload,
): Promise<ReadableStream<Uint8Array>> {
  const { baseUrl, apiKey } = getFlowiseConfig()
  const url = `${baseUrl}/prediction/${chatflowId}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ ...payload, streaming: true }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText)
    throw new Error(`Flowise prediction ${res.status}: ${body}`)
  }

  if (!res.body) throw new Error('No response body from Flowise prediction')

  const contentType = res.headers.get('Content-Type') ?? ''
  if (contentType.includes('application/json')) {
    const data = (await res.json()) as { text?: string }
    const text = typeof data?.text === 'string' ? data.text : ''
    const payloadStr = JSON.stringify({ event: 'token', data: text })
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`data: ${payloadStr}\n\n`))
        controller.close()
      },
    })
    return stream
  }

  return res.body
}

export async function syncPrediction(
  chatflowId: string,
  payload: FlowisePredictionPayload,
): Promise<FlowisePredictionResult> {
  return flowiseFetch<FlowisePredictionResult>(`/prediction/${chatflowId}`, {
    method: 'POST',
    body: JSON.stringify({ ...payload, streaming: false }),
  })
}
