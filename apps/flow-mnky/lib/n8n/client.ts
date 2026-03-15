export interface N8nWorkflow {
  id: string
  name: string
  active?: boolean
  updatedAt?: string
  createdAt?: string
  tags?: Array<{ id?: string; name?: string }>
}

export interface N8nConfigSummary {
  configured: boolean
  hostDisplay: string | null
  webhookBaseUrl: string | null
}

export interface N8nPingResult {
  status: 'healthy' | 'unreachable' | 'unauthorized' | 'not_configured'
  latencyMs?: number
  error?: string
}

function getN8nConfig() {
  const baseUrl =
    process.env.N8N_BASE_URL?.trim() ||
    process.env.N8N_API_URL?.trim()
  const apiKey = process.env.N8N_API_KEY?.trim()
  const webhookBaseUrl =
    process.env.N8N_WEBHOOK_BASE_URL?.trim() ||
    (baseUrl ? `${baseUrl.replace(/\/$/, '')}/webhook` : null)

  return {
    baseUrl: baseUrl?.replace(/\/$/, '') ?? null,
    apiKey: apiKey || null,
    webhookBaseUrl,
  }
}

export function getN8nConfigSummary(): N8nConfigSummary {
  const { baseUrl, apiKey, webhookBaseUrl } = getN8nConfig()
  return {
    configured: Boolean(baseUrl && apiKey),
    hostDisplay: baseUrl,
    webhookBaseUrl,
  }
}

async function n8nFetch<T>(path: string): Promise<T> {
  const { baseUrl, apiKey } = getN8nConfig()

  if (!baseUrl || !apiKey) {
    throw new Error('N8N_BASE_URL (or N8N_API_URL) and N8N_API_KEY must be set.')
  }

  const res = await fetch(`${baseUrl}/api/v1${path}`, {
    headers: {
      Accept: 'application/json',
      'X-N8N-API-KEY': apiKey,
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText)
    throw new Error(`n8n ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

export async function pingN8n(): Promise<N8nPingResult> {
  const { baseUrl } = getN8nConfig()

  if (!baseUrl) {
    return { status: 'not_configured', error: 'N8N_BASE_URL is not configured.' }
  }

  const start = Date.now()
  try {
    const res = await fetch(`${baseUrl}/healthz`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    })
    const latencyMs = Date.now() - start

    if (res.ok) {
      return { status: 'healthy', latencyMs }
    }

    if (res.status === 401 || res.status === 403) {
      return { status: 'unauthorized', latencyMs, error: `n8n returned ${res.status}` }
    }

    const body = await res.text().catch(() => res.statusText)
    return { status: 'unreachable', latencyMs, error: body }
  } catch (error) {
    return {
      status: 'unreachable',
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function listN8nWorkflows(active?: boolean): Promise<N8nWorkflow[]> {
  const search = new URLSearchParams({ limit: '100' })
  if (typeof active === 'boolean') {
    search.set('active', String(active))
  }

  const data = await n8nFetch<
    N8nWorkflow[] | { data?: N8nWorkflow[]; nextCursor?: string | null }
  >(`/workflows?${search.toString()}`)

  if (Array.isArray(data)) {
    return data
  }

  return data.data ?? []
}
