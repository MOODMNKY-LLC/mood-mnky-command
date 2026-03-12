/**
 * Environment Validation and Configuration Management
 * Validates all required environment variables on startup
 * Provides clear error messages for missing credentials
 */

export interface EnvironmentConfig {
  flowise: {
    apiUrl: string
    apiKey: string
    streamingEnabled: boolean
  }
  minio: {
    endpoint: string
    port: number
    useSSL: boolean
    accessKey: string
    secretKey: string
    region: string
    buckets: {
      images: string
      documents: string
      knowledge: string
      projects: string
    }
  }
  context7: {
    mcpUrl: string
    enabled: boolean
    cacheTTL: number
  }
  aiSdk: {
    openaiKey?: string
    anthropicKey?: string
    googleKey?: string
  }
  features: {
    useFlowiseFallback: boolean
    enableMinioStorage: boolean
    enableContext7MCP: boolean
  }
}

class EnvironmentValidator {
  private config: EnvironmentConfig | null = null
  private errors: string[] = []

  /**
   * Validate all environment variables on application startup
   */
  validate(): EnvironmentConfig {
    this.errors = []

    // Validate Flowise
    this.validateFlowise()

    // Validate MinIO
    this.validateMinIO()

    // Validate Context7
    this.validateContext7()

    // Validate AI SDK keys (at least one required)
    this.validateAISDK()

    if (this.errors.length > 0) {
      const errorMessage = `Environment validation failed:\n${this.errors.map(e => `  - ${e}`).join('\n')}`
      console.error(errorMessage)
      throw new Error(errorMessage)
    }

    this.config = {
      flowise: {
        apiUrl: `${process.env.FLOWISE_HOST_URL}/api/v1`,
        apiKey: process.env.FLOWISE_API_KEY!,
        streamingEnabled: process.env.FLOWISE_STREAMING_ENABLED !== 'false',
      },
      minio: {
        endpoint: process.env.MINIO_ENDPOINT!,
        port: parseInt(process.env.MINIO_PORT || '9000', 10),
        useSSL: process.env.MINIO_USE_SSL === 'true',
        accessKey: process.env.MINIO_ROOT_USER!,
        secretKey: process.env.MINIO_ROOT_PASSWORD!,
        region: process.env.MINIO_REGION || 'us-east-1',
        buckets: {
          images: process.env.MINIO_BUCKET_IMAGES || 'chat-images',
          documents: process.env.MINIO_BUCKET_DOCUMENTS || 'chat-documents',
          knowledge: process.env.MINIO_BUCKET_KNOWLEDGE || 'chat-knowledge-base',
          projects: process.env.MINIO_BUCKET_PROJECTS || 'chat-projects',
        },
      },
      context7: {
        mcpUrl: process.env.CONTEXT7_MCP_URL || 'https://mcp.context7.com/mcp',
        enabled: process.env.CONTEXT7_MCP_ENABLED !== 'false',
        cacheTTL: parseInt(process.env.CONTEXT7_CACHE_TTL || '3600', 10),
      },
      aiSdk: {
        openaiKey: process.env.OPENAI_API_KEY,
        anthropicKey: process.env.ANTHROPIC_API_KEY,
        googleKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      },
      features: {
        useFlowiseFallback: process.env.USE_FLOWISE_FALLBACK !== 'false',
        enableMinioStorage: process.env.ENABLE_MINIO_STORAGE !== 'false',
        enableContext7MCP: process.env.ENABLE_CONTEXT7_MCP !== 'false',
      },
    }

    return this.config
  }

  private validateFlowise(): void {
    if (!process.env.FLOWISE_HOST_URL) {
      this.errors.push('FLOWISE_HOST_URL is required (e.g., https://flowise-dev.moodmnky.com)')
    }
    if (!process.env.FLOWISE_API_KEY) {
      this.errors.push('FLOWISE_API_KEY is required. Get it from Flowise dashboard Settings')
    }
  }

  private validateMinIO(): void {
    // Only enforce MinIO vars when storage is explicitly enabled
    if (process.env.ENABLE_MINIO_STORAGE === 'false') return
    if (!process.env.MINIO_ENDPOINT) {
      // Not required — MinIO is optional; log a warning instead of hard-failing
      console.warn('[env] MINIO_ENDPOINT not set — file storage will be disabled')
    }
    // MINIO_ROOT_USER / MINIO_ROOT_PASSWORD are used in minio.service.ts; warn only
    if (
      process.env.MINIO_ENDPOINT &&
      (!process.env.MINIO_ROOT_USER || !process.env.MINIO_ROOT_PASSWORD)
    ) {
      console.warn('[env] MINIO_ROOT_USER or MINIO_ROOT_PASSWORD not set — MinIO auth may fail')
    }
  }

  private validateContext7(): void {
    if (process.env.CONTEXT7_MCP_ENABLED === 'true' && !process.env.CONTEXT7_MCP_URL) {
      this.errors.push('CONTEXT7_MCP_URL is required when CONTEXT7_MCP_ENABLED=true')
    }
  }

  private validateAISDK(): void {
    const hasAISDKKey =
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY

    if (!hasAISDKKey) {
      // Warn only — Flowise may be the primary backend
      console.warn('[env] No AI SDK key found (OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY). AI SDK fallback will be unavailable.')
    }
  }

  /**
   * Test connectivity to external services
   */
  async testConnectivity(): Promise<{
    flowise: boolean
    minio: boolean
    context7: boolean
    errors: Record<string, string>
  }> {
    const results = { flowise: false, minio: false, context7: false, errors: {} as Record<string, string> }

    if (!this.config) {
      throw new Error('Environment not validated. Call validate() first')
    }

    // Test Flowise
    try {
      const flowiseResponse = await fetch(`${this.config.flowise.apiUrl}/chatflow`, {
        headers: { Authorization: `Bearer ${this.config.flowise.apiKey}` },
      })
      results.flowise = flowiseResponse.ok
    } catch (error) {
      results.errors.flowise = `Failed to connect to Flowise: ${error instanceof Error ? error.message : String(error)}`
    }

    // Test MinIO (basic connectivity)
    try {
      const minioUrl = `http${this.config.minio.useSSL ? 's' : ''}://${this.config.minio.endpoint}:${this.config.minio.port}`
      const response = await fetch(`${minioUrl}/minio/health/live`)
      results.minio = response.ok
    } catch (error) {
      results.errors.minio = `Failed to connect to MinIO: ${error instanceof Error ? error.message : String(error)}`
    }

    // Test Context7 (if enabled)
    if (this.config.context7.enabled) {
      try {
        const response = await fetch(this.config.context7.mcpUrl, { method: 'HEAD' })
        results.context7 = response.ok || response.status === 405 // 405 is acceptable for HEAD requests
      } catch (error) {
        results.errors.context7 = `Failed to connect to Context7: ${error instanceof Error ? error.message : String(error)}`
      }
    }

    return results
  }

  /**
   * Get validated configuration
   */
  getConfig(): EnvironmentConfig {
    if (!this.config) {
      throw new Error('Environment not validated. Call validate() first')
    }
    return this.config
  }
}

// Singleton instance
let validator: EnvironmentValidator | null = null

export function getEnvironmentValidator(): EnvironmentValidator {
  if (!validator) {
    validator = new EnvironmentValidator()
  }
  return validator
}

export function validateEnvironment(): EnvironmentConfig {
  return getEnvironmentValidator().validate()
}

export async function testServiceConnectivity() {
  return getEnvironmentValidator().testConnectivity()
}

export function getValidatedConfig(): EnvironmentConfig {
  return getEnvironmentValidator().getConfig()
}
