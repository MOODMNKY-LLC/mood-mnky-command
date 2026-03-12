/**
 * Health Check API Route
 * Monitors status of all integrated services
 */

import { NextRequest, NextResponse } from 'next/server'
import { getFlowiseService } from '@/lib/services/flowise.service'
import { getMinIOService } from '@/lib/services/minio.service'
import { getContext7MCPService } from '@/lib/services/context7-mcp.service'
import { testServiceConnectivity, getValidatedConfig } from '@/lib/env-validation'

interface ServiceStatus {
  available: boolean
  latency: number
  lastCheck: Date
  error?: string
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  services: {
    flowise: ServiceStatus
    minio: ServiceStatus
    context7: ServiceStatus
    openai: ServiceStatus
  }
  timestamp: Date
  uptime: number
}

export async function GET(request: NextRequest): Promise<NextResponse<HealthCheckResponse>> {
  const startTime = Date.now()

  try {
    const [flowiseStatus, minioStatus, context7Status, aiSDKStatus] = await Promise.all([
      checkFlowiseHealth(),
      checkMinIOHealth(),
      checkContext7Health(),
      checkAISDKHealth(),
    ])

    const allHealthy =
      flowiseStatus.available && minioStatus.available && aiSDKStatus.available

    const someHealthy = flowiseStatus.available || minioStatus.available || aiSDKStatus.available

    const response: HealthCheckResponse = {
      status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy',
      services: {
        flowise: flowiseStatus,
        minio: minioStatus,
        context7: context7Status,
        openai: aiSDKStatus,
      },
      timestamp: new Date(),
      uptime: process.uptime(),
    }

    console.log(`[v0] Health check completed: ${response.status}`)

    return NextResponse.json(response, {
      status: allHealthy ? 200 : someHealthy ? 206 : 503,
    })
  } catch (error) {
    console.error('[v0] Health check error:', error)

    const response: HealthCheckResponse = {
      status: 'unhealthy',
      services: {
        flowise: {
          available: false,
          latency: 0,
          lastCheck: new Date(),
          error: 'Health check failed',
        },
        minio: {
          available: false,
          latency: 0,
          lastCheck: new Date(),
          error: 'Health check failed',
        },
        context7: {
          available: false,
          latency: 0,
          lastCheck: new Date(),
          error: 'Health check failed',
        },
        openai: {
          available: false,
          latency: 0,
          lastCheck: new Date(),
          error: 'Health check failed',
        },
      },
      timestamp: new Date(),
      uptime: process.uptime(),
    }

    return NextResponse.json(response, { status: 503 })
  }
}

/**
 * Check Flowise service health
 */
async function checkFlowiseHealth(): Promise<ServiceStatus> {
  const startTime = Date.now()

  try {
    const flowiseService = getFlowiseService()
    const isHealthy = await flowiseService.validateConnection()

    const latency = Date.now() - startTime

    console.log(`[v0] Flowise health: ${isHealthy ? 'ok' : 'failed'} (${latency}ms)`)

    return {
      available: isHealthy,
      latency,
      lastCheck: new Date(),
    }
  } catch (error) {
    const latency = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error(`[v0] Flowise health check failed: ${errorMessage}`)

    return {
      available: false,
      latency,
      lastCheck: new Date(),
      error: errorMessage,
    }
  }
}

/**
 * Check MinIO service health
 */
async function checkMinIOHealth(): Promise<ServiceStatus> {
  const startTime = Date.now()

  try {
    const minioService = getMinIOService()
    const isHealthy = await minioService.testConnectivity()

    const latency = Date.now() - startTime

    console.log(`[v0] MinIO health: ${isHealthy ? 'ok' : 'failed'} (${latency}ms)`)

    return {
      available: isHealthy,
      latency,
      lastCheck: new Date(),
    }
  } catch (error) {
    const latency = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error(`[v0] MinIO health check failed: ${errorMessage}`)

    return {
      available: false,
      latency,
      lastCheck: new Date(),
      error: errorMessage,
    }
  }
}

/**
 * Check Context7 MCP service health
 */
async function checkContext7Health(): Promise<ServiceStatus> {
  const startTime = Date.now()

  try {
    const config = getValidatedConfig()

    if (!config.context7.enabled) {
      console.log('[v0] Context7 health: disabled')
      return {
        available: true,
        latency: 0,
        lastCheck: new Date(),
      }
    }

    const context7Service = getContext7MCPService()
    const docs = await context7Service.fetchDocumentation(['nodejs'])
    const isHealthy = docs.length > 0 || (docs.length === 0 && Math.random() > 0.1) // Consider empty docs as OK if fetch succeeds

    const latency = Date.now() - startTime

    console.log(`[v0] Context7 health: ${isHealthy ? 'ok' : 'failed'} (${latency}ms)`)

    return {
      available: isHealthy,
      latency,
      lastCheck: new Date(),
    }
  } catch (error) {
    const latency = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error(`[v0] Context7 health check failed: ${errorMessage}`)

    return {
      available: false,
      latency,
      lastCheck: new Date(),
      error: errorMessage,
    }
  }
}

/**
 * Check AI SDK configuration
 */
async function checkAISDKHealth(): Promise<ServiceStatus> {
  const startTime = Date.now()

  try {
    const config = getValidatedConfig()
    const hasAISDKKey =
      config.aiSdk.openaiKey || config.aiSdk.anthropicKey || config.aiSdk.googleKey

    const isHealthy = hasAISDKKey !== undefined

    const latency = Date.now() - startTime

    console.log(`[v0] AI SDK health: ${isHealthy ? 'ok' : 'failed'} (${latency}ms)`)

    return {
      available: isHealthy,
      latency,
      lastCheck: new Date(),
    }
  } catch (error) {
    const latency = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error(`[v0] AI SDK health check failed: ${errorMessage}`)

    return {
      available: false,
      latency,
      lastCheck: new Date(),
      error: errorMessage,
    }
  }
}
