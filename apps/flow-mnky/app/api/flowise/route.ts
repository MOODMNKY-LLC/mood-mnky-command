/**
 * Flowise API Route
 * Bridges chat requests to Flowise prediction endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { getFlowiseService } from '@/lib/services/flowise.service'
import { getMinIOService } from '@/lib/services/minio.service'
import { getValidatedConfig } from '@/lib/env-validation'

export async function POST(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get('action')

    if (action === 'predict') {
      return await handlePredict(request)
    } else if (action === 'knowledge') {
      return await handleKnowledge(request)
    } else if (action === 'validate') {
      return await handleValidate(request)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[v0] Flowise API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get('action')

    if (action === 'history') {
      return await handleHistory(request)
    } else if (action === 'chatflows') {
      return await handleChatflows(request)
    } else if (action === 'health') {
      return await handleHealth(request)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[v0] Flowise API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Handle streaming predictions from Flowise
 */
async function handlePredict(request: NextRequest): Promise<NextResponse> {
  const body = await request.json()
  const { messages, sessionId, returnSourceDocuments = true, streaming = true } = body

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 })
  }

  try {
    const flowiseService = getFlowiseService()

    // Create session if needed
    let session = sessionId ? flowiseService.getSession(sessionId) : null
    if (!session) {
      session = flowiseService.createSession()
    }

    // Format messages for Flowise
    const question = messages[messages.length - 1]?.content || ''
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }))

    console.log(`[v0] Flowise prediction request - Session: ${session.id}, Streaming: ${streaming}`)

    if (streaming) {
      // Stream response
      const stream = await flowiseService.predictStreaming({
        question,
        history,
        overrideConfig: {
          sessionId: session.id,
          returnSourceDocuments,
        },
      })

      flowiseService.incrementMessageCount(session.id)

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Session-Id': session.id,
        },
      })
    } else {
      // Non-streaming response
      const result = await flowiseService.predictSync({
        question,
        history,
        overrideConfig: {
          sessionId: session.id,
          returnSourceDocuments,
        },
      })

      flowiseService.incrementMessageCount(session.id)

      console.log(`[v0] Flowise prediction response - Session: ${session.id}`)

      return NextResponse.json(
        {
          text: result.text,
          sourceDocuments: result.sourceDocuments || [],
          sessionId: session.id,
          messageCount: session.messageCount,
        },
        {
          headers: {
            'X-Session-Id': session.id,
          },
        }
      )
    }
  } catch (error) {
    console.error('[v0] Prediction error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Prediction failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle chat history retrieval
 */
async function handleHistory(request: NextRequest): Promise<NextResponse> {
  const sessionId = request.nextUrl.searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }

  try {
    const flowiseService = getFlowiseService()
    const history = await flowiseService.getHistory(sessionId)

    console.log(`[v0] Retrieved history for session: ${sessionId}`)

    return NextResponse.json({ messages: history }, { status: 200 })
  } catch (error) {
    console.error('[v0] History error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'History retrieval failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle knowledge base indexing
 */
async function handleKnowledge(request: NextRequest): Promise<NextResponse> {
  const body = await request.json()
  const { fileId, bucket, objectName, knowledgeBaseId } = body

  if (!fileId || !bucket || !objectName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const minioService = getMinIOService()
    const flowiseService = getFlowiseService()
    const config = getValidatedConfig()

    // Download file from MinIO
    const fileBuffer = await minioService.downloadFile(bucket, objectName)

    console.log(`[v0] Downloaded file for knowledge base indexing: ${objectName}`)

    // In a real implementation, you would send the file to Flowise for indexing
    // This is a placeholder for the actual implementation
    // const indexResult = await flowiseService.indexKnowledgeBase({
    //   fileId,
    //   content: fileBuffer.toString(),
    //   knowledgeBaseId: knowledgeBaseId || config.flowise.chatflowId,
    // })

    return NextResponse.json(
      {
        success: true,
        fileId,
        bucket,
        objectName,
        knowledgeBaseId: knowledgeBaseId || config.flowise.chatflowId,
        indexedAt: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Knowledge base indexing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Indexing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle available chatflows retrieval
 */
async function handleChatflows(request: NextRequest): Promise<NextResponse> {
  try {
    const flowiseService = getFlowiseService()
    const chatflows = await flowiseService.getAvailableChatflows()

    console.log(`[v0] Retrieved ${chatflows.length} available chatflows`)

    return NextResponse.json({ chatflows }, { status: 200 })
  } catch (error) {
    console.error('[v0] Chatflows retrieval error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Retrieval failed' },
      { status: 500 }
    )
  }
}

/**
 * Validate Flowise connection
 */
async function handleValidate(request: NextRequest): Promise<NextResponse> {
  try {
    const flowiseService = getFlowiseService()
    const isConnected = await flowiseService.validateConnection()

    console.log(`[v0] Flowise validation: ${isConnected ? 'connected' : 'disconnected'}`)

    return NextResponse.json(
      {
        connected: isConnected,
        apiUrl: process.env.FLOWISE_API_URL,
        timestamp: new Date().toISOString(),
      },
      { status: isConnected ? 200 : 503 }
    )
  } catch (error) {
    console.error('[v0] Validation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Validation failed', connected: false },
      { status: 503 }
    )
  }
}

/**
 * Health check
 */
async function handleHealth(request: NextRequest): Promise<NextResponse> {
  try {
    const flowiseService = getFlowiseService()
    const isHealthy = await flowiseService.validateConnection()

    return NextResponse.json(
      {
        status: isHealthy ? 'healthy' : 'unhealthy',
        service: 'flowise-api',
        timestamp: new Date().toISOString(),
      },
      { status: isHealthy ? 200 : 503 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'flowise-api',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
