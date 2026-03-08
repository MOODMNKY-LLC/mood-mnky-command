import { NextRequest, NextResponse } from 'next/server'
import { getFlowiseService } from '@/lib/services/flowise.service'
import { getMinIOService } from '@/lib/services/minio.service'
import { getContext7MCPService } from '@/lib/services/context7-mcp.service'
import { validateEnvironment } from '@/lib/env-validation'

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables inside the handler, not at module level
    const config = validateEnvironment()

    const results = {
      timestamp: new Date().toISOString(),
      services: {
        flowise: { status: 'unknown', message: '', chatflows: [] },
        minio: { status: 'unknown', message: '' },
        context7: { status: 'unknown', message: '' },
      },
      config: {
        flowise: {
          host: config.flowise.apiUrl,
          hasApiKey: !!config.flowise.apiKey,
        },
        minio: {
          endpoint: config.minio.endpoint,
          port: config.minio.port,
          useSSL: config.minio.useSSL,
          buckets: config.minio.buckets,
        },
      },
    }

    // Test Flowise
    console.log('[v0] Testing Flowise connection...')
    try {
      const flowiseService = getFlowiseService()
      const chatflows = await flowiseService.listChatflows()
      results.services.flowise.status = 'connected'
      results.services.flowise.message = `Found ${chatflows.length} chatflow(s)`
      results.services.flowise.chatflows = chatflows
      console.log('[v0] ✓ Flowise connected, chatflows:', chatflows.length)
    } catch (error) {
      results.services.flowise.status = 'error'
      results.services.flowise.message = error instanceof Error ? error.message : String(error)
      console.error('[v0] ✗ Flowise error:', error)
    }

    // Test MinIO
    console.log('[v0] Testing MinIO connection...')
    try {
      const minioService = getMinIOService()
      await minioService.ensureBucket(config.minio.buckets.images)
      results.services.minio.status = 'connected'
      results.services.minio.message = 'Buckets verified'
      console.log('[v0] ✓ MinIO connected')
    } catch (error) {
      results.services.minio.status = 'error'
      results.services.minio.message = error instanceof Error ? error.message : String(error)
      console.warn('[v0] ⚠ MinIO error (non-blocking):', error)
    }

    // Test Context7
    console.log('[v0] Testing Context7 MCP connection...')
    if (config.context7.enabled) {
      try {
        const context7Service = getContext7MCPService()
        const docs = await context7Service.fetchDocumentation(['nodejs'])
        results.services.context7.status = 'connected'
        results.services.context7.message = `Fetched ${docs.length} documentation entries`
        console.log('[v0] ✓ Context7 MCP connected')
      } catch (error) {
        results.services.context7.status = 'error'
        results.services.context7.message = error instanceof Error ? error.message : String(error)
        console.warn('[v0] ⚠ Context7 error (non-blocking):', error)
      }
    } else {
      results.services.context7.status = 'disabled'
      results.services.context7.message = 'Context7 MCP is disabled'
      console.log('[v0] ⓘ Context7 MCP is disabled')
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    console.error('[v0] Verification failed:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Verification failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
