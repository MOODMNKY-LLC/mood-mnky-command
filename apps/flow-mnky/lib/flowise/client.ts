/**
 * Flowise BFF Client
 * All calls to Flowise happen server-side through this module.
 * API keys are never exposed to the browser.
 */

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

  return {
    baseUrl: `${hostUrl.replace(/\/$/, '')}/api/v1`,
    apiKey,
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
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ ...payload, streaming: true }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText)
    throw new Error(`Flowise prediction ${res.status}: ${body}`)
  }

  if (!res.body) throw new Error('No response body from Flowise prediction')
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
