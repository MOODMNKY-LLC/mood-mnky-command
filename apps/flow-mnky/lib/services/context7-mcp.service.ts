/**
 * Context7 MCP Plugin Integration Service
 * Fetches and caches up-to-date documentation from Context7 MCP
 */

import { getValidatedConfig } from '@/lib/env-validation'

export interface Context7Documentation {
  library: string
  version: string
  summary: string
  content: string
  links: string[]
  category?: string
  lastUpdated: Date
}

export interface Context7Example {
  library: string
  topic: string
  code: string
  description: string
  language: string
  links: string[]
}

class Context7MCPService {
  private cache: Map<string, { data: unknown; expiresAt: Date }> = new Map()
  private requestInProgress: Map<string, Promise<unknown>> = new Map()

  /**
   * Fetch documentation from Context7 MCP
   */
  async fetchDocumentation(libraries: string[] = []): Promise<Context7Documentation[]> {
    const config = getValidatedConfig()

    if (!config.context7.enabled) {
      console.log('[v0] Context7 MCP is disabled')
      return []
    }

    const cacheKey = `docs-${libraries.join(',')}`

    // Check cache first
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      console.log('[v0] Returning Context7 docs from cache')
      return cached as Context7Documentation[]
    }

    // Prevent duplicate requests
    if (this.requestInProgress.has(cacheKey)) {
      return await (this.requestInProgress.get(cacheKey) as Promise<Context7Documentation[]>)
    }

    const promise = this._fetchDocumentationImpl(libraries, config.context7.mcpUrl, config.context7.cacheTTL)
    this.requestInProgress.set(cacheKey, promise)

    try {
      const result = await promise
      return result
    } finally {
      this.requestInProgress.delete(cacheKey)
    }
  }

  private async _fetchDocumentationImpl(
    libraries: string[],
    mcpUrl: string,
    cacheTTL: number
  ): Promise<Context7Documentation[]> {
    try {
      const params = new URLSearchParams()
      if (libraries.length > 0) {
        params.append('libraries', libraries.join(','))
      }

      const url = `${mcpUrl}/documentation?${params.toString()}`
      console.log('[v0] Fetching Context7 documentation from:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ai-chat-flowise-integration',
        },
      })

      if (!response.ok) {
        console.error('[v0] Context7 MCP error:', response.status, response.statusText)
        return []
      }

      const data = await response.json()
      const docs = Array.isArray(data) ? data : [data]

      // Cache the result
      const cacheKey = `docs-${libraries.join(',')}`
      this.setCache(cacheKey, docs, cacheTTL)

      console.log(`[v0] Fetched ${docs.length} documentation entries from Context7`)
      return docs as Context7Documentation[]
    } catch (error) {
      console.error('[v0] Error fetching Context7 documentation:', error)
      return []
    }
  }

  /**
   * Get code examples from Context7
   */
  async getCodeExamples(library: string, topic?: string): Promise<Context7Example[]> {
    const config = getValidatedConfig()

    if (!config.context7.enabled) {
      return []
    }

    const cacheKey = `examples-${library}-${topic || 'all'}`

    // Check cache first
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      console.log('[v0] Returning Context7 examples from cache')
      return cached as Context7Example[]
    }

    try {
      const params = new URLSearchParams({ library })
      if (topic) {
        params.append('topic', topic)
      }

      const url = `${config.context7.mcpUrl}/examples?${params.toString()}`
      console.log('[v0] Fetching Context7 examples from:', url)

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ai-chat-flowise-integration',
        },
      })

      if (!response.ok) {
        console.error('[v0] Context7 MCP examples error:', response.status)
        return []
      }

      const data = await response.json()
      const examples = Array.isArray(data) ? data : [data]

      // Cache the result
      this.setCache(cacheKey, examples, config.context7.cacheTTL)

      console.log(`[v0] Fetched ${examples.length} code examples from Context7`)
      return examples as Context7Example[]
    } catch (error) {
      console.error('[v0] Error fetching Context7 examples:', error)
      return []
    }
  }

  /**
   * Search documentation in Context7
   */
  async searchDocumentation(query: string): Promise<Context7Documentation[]> {
    const config = getValidatedConfig()

    if (!config.context7.enabled) {
      return []
    }

    const cacheKey = `search-${query}`

    // Check cache first
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      console.log('[v0] Returning Context7 search results from cache')
      return cached as Context7Documentation[]
    }

    try {
      const url = `${config.context7.mcpUrl}/search?q=${encodeURIComponent(query)}`
      console.log('[v0] Searching Context7 documentation for:', query)

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ai-chat-flowise-integration',
        },
      })

      if (!response.ok) {
        console.error('[v0] Context7 MCP search error:', response.status)
        return []
      }

      const data = await response.json()
      const results = Array.isArray(data) ? data : [data]

      // Cache the result
      this.setCache(cacheKey, results, config.context7.cacheTTL)

      console.log(`[v0] Found ${results.length} search results in Context7`)
      return results as Context7Documentation[]
    } catch (error) {
      console.error('[v0] Error searching Context7 documentation:', error)
      return []
    }
  }

  /**
   * Get library version information
   */
  async getLibraryVersion(library: string): Promise<string | null> {
    const config = getValidatedConfig()

    if (!config.context7.enabled) {
      return null
    }

    const cacheKey = `version-${library}`

    // Check cache first
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      console.log('[v0] Returning library version from cache')
      return cached as string
    }

    try {
      const url = `${config.context7.mcpUrl}/version/${library}`
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ai-chat-flowise-integration',
        },
      })

      if (!response.ok) {
        console.error('[v0] Error fetching library version:', response.status)
        return null
      }

      const data = await response.json()
      const version = data.version || data.latest || null

      // Cache the result
      if (version) {
        this.setCache(cacheKey, version, config.context7.cacheTTL)
      }

      return version
    } catch (error) {
      console.error('[v0] Error getting library version:', error)
      return null
    }
  }

  /**
   * Validate that library is available in Context7
   */
  async validateLibraryContext(library: string): Promise<boolean> {
    const version = await this.getLibraryVersion(library)
    return version !== null
  }

  /**
   * Invalidate cache entries
   */
  invalidateCache(pattern?: string): number {
    let clearedCount = 0

    if (!pattern) {
      clearedCount = this.cache.size
      this.cache.clear()
      console.log(`[v0] Cleared entire Context7 cache (${clearedCount} entries)`)
    } else {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
          clearedCount++
        }
      }
      console.log(`[v0] Cleared ${clearedCount} Context7 cache entries matching: ${pattern}`)
    }

    return clearedCount
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { entries: number; memoryUsage: string } {
    const entries = this.cache.size
    // Rough estimation of memory usage (this is not precise)
    const memoryUsage = `~${entries * 2}KB`

    return { entries, memoryUsage }
  }

  /**
   * Helper: Get from cache
   */
  private getFromCache(key: string): unknown | null {
    const cached = this.cache.get(key)

    if (!cached) {
      return null
    }

    // Check if expired
    if (new Date() > cached.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * Helper: Set cache
   */
  private setCache(key: string, data: unknown, ttlSeconds: number): void {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000)
    this.cache.set(key, { data, expiresAt })
  }

  /**
   * Clean up expired cache entries periodically
   */
  cleanupExpiredCache(): void {
    const now = new Date()
    let clearedCount = 0

    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        this.cache.delete(key)
        clearedCount++
      }
    }

    if (clearedCount > 0) {
      console.log(`[v0] Cleaned up ${clearedCount} expired Context7 cache entries`)
    }
  }
}

// Singleton instance
let context7Service: Context7MCPService | null = null

export function getContext7MCPService(): Context7MCPService {
  if (!context7Service) {
    context7Service = new Context7MCPService()

    // Clean up expired cache every 30 minutes
    setInterval(() => {
      context7Service?.cleanupExpiredCache()
    }, 30 * 60 * 1000)
  }

  return context7Service
}

export type { Context7Documentation, Context7Example }
