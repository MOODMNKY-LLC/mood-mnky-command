/**
 * Flowise API Bridge Service
 * Handles integration with Flowise chatflow predictions and knowledge base
 */

import { getValidatedConfig } from '@/lib/env-validation'

export interface FlowisePredictionRequest {
  question: string
  chatflowId?: string
  history?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  overrideConfig?: {
    sessionId?: string
    returnSourceDocuments?: boolean
    knowledgeBaseIds?: string[]
  }
  streaming?: boolean
}

export interface FlowisePredictionResponse {
  text: string
  sourceDocuments?: Array<{
    id: string
    name: string
    source: string
    score: number
    metadata?: Record<string, unknown>
  }>
  sessionId?: string
  tokens?: number
}

export interface FloWiseSession {
  id: string
  chatflowId: string
  userId?: string
  createdAt: Date
  expiresAt: Date
  messageCount: number
  knowledgeBaseIds: string[]
}

export interface FlowiseChatflow {
  id: string
  name: string
  description?: string
  isPublic: boolean
  createdDate?: Date
  updatedDate?: Date
}

class FlowiseService {
  private sessions: Map<string, FloWiseSession> = new Map()
  private defaultChatflowId: string | null = null

  /**
   * Get list of available chatflows
   */
  async listChatflows(): Promise<FlowiseChatflow[]> {
    const config = getValidatedConfig()
    const url = `${config.flowise.apiUrl}/chatflows`

    console.log('[v0] Fetching Flowise chatflows:', url)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.flowise.apiKey}`,
        },
      })

      if (!response.ok) {
        console.warn('[v0] Failed to list chatflows:', response.status)
        return []
      }

      const data = await response.json()
      console.log('[v0] Found chatflows:', data.length)
      return data
    } catch (error) {
      console.error('[v0] Error listing chatflows:', error)
      return []
    }
  }

  /**
   * Set the default chatflow to use
   */
  async setDefaultChatflow(): Promise<string | null> {
    const chatflows = await this.listChatflows()
    if (chatflows.length > 0) {
      this.defaultChatflowId = chatflows[0].id
      console.log('[v0] Set default chatflow to:', this.defaultChatflowId)
      return this.defaultChatflowId
    }
    return null
  }

  /**
   * Stream prediction from Flowise
   */
  async predictStreaming(request: FlowisePredictionRequest): Promise<ReadableStream<string>> {
    const config = getValidatedConfig()
    
    let chatflowId = request.chatflowId || this.defaultChatflowId
    if (!chatflowId) {
      chatflowId = await this.setDefaultChatflow()
    }

    if (!chatflowId) {
      throw new Error('No chatflow ID available. Please check Flowise setup.')
    }

    const url = `${config.flowise.apiUrl}/prediction/${chatflowId}`

    console.log('[v0] Calling Flowise streaming prediction:', url)

    const payload = {
      question: request.question,
      history: request.history || [],
      overrideConfig: {
        returnSourceDocuments: request.overrideConfig?.returnSourceDocuments ?? true,
        ...request.overrideConfig,
      },
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.flowise.apiKey}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('[v0] Flowise error response:', error)
        throw new Error(`Flowise API error: ${response.status} ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body from Flowise')
      }

      console.log('[v0] Flowise streaming started')
      return response.body.pipeThrough(new TextEncoderStream())
    } catch (error) {
      console.error('[v0] Error calling Flowise streaming prediction:', error)
      throw error
    }
  }

  /**
   * Non-streaming prediction from Flowise
   */
  async predictSync(request: FlowisePredictionRequest): Promise<FlowisePredictionResponse> {
    const config = getValidatedConfig()
    
    let chatflowId = request.chatflowId || this.defaultChatflowId
    if (!chatflowId) {
      chatflowId = await this.setDefaultChatflow()
    }

    if (!chatflowId) {
      throw new Error('No chatflow ID available. Please check Flowise setup.')
    }

    const url = `${config.flowise.apiUrl}/prediction/${chatflowId}`

    console.log('[v0] Calling Flowise sync prediction:', url)

    const payload = {
      question: request.question,
      history: request.history || [],
      overrideConfig: {
        returnSourceDocuments: request.overrideConfig?.returnSourceDocuments ?? true,
        ...request.overrideConfig,
      },
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.flowise.apiKey}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('[v0] Flowise error:', error)
        throw new Error(`Flowise API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      return {
        text: typeof data === 'string' ? data : data.text || data.output || '',
        sourceDocuments: data.sourceDocuments || [],
        sessionId: request.overrideConfig?.sessionId,
      }
    } catch (error) {
      console.error('[v0] Error calling Flowise sync prediction:', error)
      throw error
    }
  }

  /**
   * Get chat history from Flowise
   */
  async getHistory(sessionId: string): Promise<FlowisePredictionRequest['history']> {
    const config = getValidatedConfig()
    const url = `${config.flowise.apiUrl}/prediction/${config.flowise.chatflowId}/history?sessionId=${sessionId}`

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${config.flowise.apiKey}`,
        },
      })

      if (!response.ok) {
        console.error('[v0] Error fetching history:', response.status)
        return []
      }

      const data = await response.json()
      return data.messages || []
    } catch (error) {
      console.error('[v0] Error getting Flowise history:', error)
      return []
    }
  }

  /**
   * Validate Flowise connection
   */
  async validateConnection(): Promise<boolean> {
    const config = getValidatedConfig()
    const url = `${config.flowise.apiUrl}/chatflow`

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${config.flowise.apiKey}`,
        },
      })

      const isValid = response.ok
      console.log(`[v0] Flowise connection validation: ${isValid ? 'passed' : 'failed'}`)
      return isValid
    } catch (error) {
      console.error('[v0] Flowise connection validation failed:', error)
      return false
    }
  }

  /**
   * Get available chatflows from Flowise
   */
  async getAvailableChatflows(): Promise<
    Array<{
      id: string
      name: string
      description?: string
    }>
  > {
    const config = getValidatedConfig()
    const url = `${config.flowise.apiUrl}/chatflow`

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${config.flowise.apiKey}`,
        },
      })

      if (!response.ok) {
        console.error('[v0] Error fetching chatflows:', response.status)
        return []
      }

      const data = await response.json()
      return Array.isArray(data) ? data.map((cf: any) => ({ id: cf.id, name: cf.name, description: cf.description })) : []
    } catch (error) {
      console.error('[v0] Error getting available chatflows:', error)
      return []
    }
  }

  /**
   * Create or get session
   */
  createSession(userId?: string): FloWiseSession {
    const sessionId = `flowise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours

    const config = getValidatedConfig()
    const session: FloWiseSession = {
      id: sessionId,
      chatflowId: config.flowise.chatflowId,
      userId,
      createdAt: now,
      expiresAt,
      messageCount: 0,
      knowledgeBaseIds: [],
    }

    this.sessions.set(sessionId, session)
    console.log(`[v0] Created Flowise session: ${sessionId}`)

    return session
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): FloWiseSession | null {
    const session = this.sessions.get(sessionId)

    if (!session) {
      return null
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId)
      console.log(`[v0] Flowise session expired: ${sessionId}`)
      return null
    }

    return session
  }

  /**
   * Update session knowledge base
   */
  updateSessionKnowledgeBase(sessionId: string, knowledgeBaseIds: string[]): void {
    const session = this.getSession(sessionId)
    if (session) {
      session.knowledgeBaseIds = knowledgeBaseIds
      console.log(`[v0] Updated Flowise session knowledge base: ${sessionId}`)
    }
  }

  /**
   * Increment message count
   */
  incrementMessageCount(sessionId: string): void {
    const session = this.getSession(sessionId)
    if (session) {
      session.messageCount++
    }
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): number {
    const now = new Date()
    let cleanedCount = 0

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`[v0] Cleaned up ${cleanedCount} expired Flowise sessions`)
    }

    return cleanedCount
  }
}

// Singleton instance
let flowiseService: FlowiseService | null = null

export function getFlowiseService(): FlowiseService {
  if (!flowiseService) {
    flowiseService = new FlowiseService()

    // Clean up expired sessions every hour
    setInterval(() => {
      flowiseService?.cleanupExpiredSessions()
    }, 60 * 60 * 1000)
  }

  return flowiseService
}

export type { FloWiseSession }
