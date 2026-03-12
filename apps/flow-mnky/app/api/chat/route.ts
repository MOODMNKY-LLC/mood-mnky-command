import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
  tool,
} from 'ai'
import { z } from 'zod'
import { getFlowiseService } from '@/lib/services/flowise.service'
import { getContext7MCPService } from '@/lib/services/context7-mcp.service'
import { getMinIOService } from '@/lib/services/minio.service'
import { getValidatedConfig } from '@/lib/env-validation'

export const maxDuration = 60

export async function POST(req: Request) {
  const {
    messages,
    model,
    agentMode,
    useFlowise = false,
    sessionId,
  }: {
    messages: UIMessage[]
    model?: string
    agentMode?: string
    useFlowise?: boolean
    sessionId?: string
  } = await req.json()

  try {
    const config = getValidatedConfig()

    // Route to Flowise if enabled
    if (useFlowise && config.features.useFlowiseFallback) {
      console.log('[v0] Routing request to Flowise')
      return handleFlowisePrediction(messages, sessionId, agentMode)
    }

    // Use AI SDK native models (with fallback logic)
    console.log('[v0] Routing request to AI SDK native backend')
    return handleAISDKPrediction(messages, model, agentMode)
  } catch (error) {
    console.error('[v0] Chat route error:', error)

    // Fallback to AI SDK if Flowise fails
    if (useFlowise) {
      console.log('[v0] Flowise failed, falling back to AI SDK')
      const selectedModel = model || 'openai/gpt-4o'
      return handleAISDKPrediction(messages, selectedModel, agentMode)
    }

    throw error
  }
}

/**
 * Handle Flowise prediction
 */
async function handleFlowisePrediction(
  messages: UIMessage[],
  sessionId?: string,
  agentMode?: string
): Promise<Response> {
  const flowiseService = getFlowiseService()

  // Get or create session
  let session = sessionId ? flowiseService.getSession(sessionId) : null
  if (!session) {
    session = flowiseService.createSession()
  }

  // Extract the last user message
  const question = messages.length > 0 ? getMessageContent(messages[messages.length - 1]) : ''
  const history = messages
    .slice(0, -1)
    .map((msg) => ({
      role: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: getMessageContent(msg),
    }))

  try {
    // Fetch Context7 documentation if coder mode
    let context7Context = ''
    if (agentMode === 'coder') {
      const context7Service = getContext7MCPService()
      const docs = await context7Service.fetchDocumentation(['nodejs', 'typescript', 'react'])
      if (docs.length > 0) {
        context7Context = `\n\nCurrent context from documentation:\n${docs.map((d) => `- ${d.library} v${d.version}: ${d.summary}`).join('\n')}`
      }
    }

    // Stream prediction from Flowise
    const stream = await flowiseService.predictStreaming({
      question: question + context7Context,
      history,
      overrideConfig: {
        sessionId: session.id,
        returnSourceDocuments: true,
      },
      streaming: true,
    })

    flowiseService.incrementMessageCount(session.id)

    console.log(`[v0] Flowise streaming response for session: ${session.id}`)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Session-Id': session.id,
        'X-Backend': 'flowise',
      },
    })
  } catch (error) {
    console.error('[v0] Flowise prediction error:', error)
    throw error
  }
}

/**
 * Handle AI SDK native prediction
 */
async function handleAISDKPrediction(
  messages: UIMessage[],
  model?: string,
  agentMode?: string
): Promise<Response> {
  const selectedModel = model || 'openai/gpt-4o'

  const systemPrompt = getSystemPrompt(agentMode)

  // Fetch Context7 documentation if enabled
  let enhancedSystemPrompt = systemPrompt
  const config = getValidatedConfig()

  if (config.context7.enabled && agentMode === 'coder') {
    try {
      const context7Service = getContext7MCPService()
      const docs = await context7Service.fetchDocumentation(['nodejs', 'typescript', 'react'])
      if (docs.length > 0) {
        const docsSummary = docs.map((d) => `- ${d.library} v${d.version}: ${d.summary}`).join('\n')
        enhancedSystemPrompt += `\n\n## Up-to-date Documentation (Context7 MCP):\n${docsSummary}`
      }
    } catch (error) {
      console.warn('[v0] Failed to fetch Context7 docs, continuing without:', error)
    }
  }

  const tools = {
    searchKnowledgeBase: tool({
      description: 'Search through uploaded documents and knowledge base files',
      inputSchema: z.object({
        query: z.string().describe('The search query'),
      }),
      execute: async ({ query }) => {
        console.log(`[v0] Searching knowledge base for: ${query}`)
        return { results: [`Found relevant information for: ${query}`], source: 'knowledge_base' }
      },
    }),
    analyzeFile: tool({
      description: 'Analyze an uploaded file from MinIO storage',
      inputSchema: z.object({
        fileId: z.string().describe('The file ID'),
        analysisType: z.string().describe('Type of analysis to perform'),
      }),
      execute: async ({ fileId, analysisType }) => {
        console.log(`[v0] Analyzing file: ${fileId}`)
        return { analysis: `File analysis (${analysisType}) for: ${fileId}` }
      },
    }),
    listStorageFiles: tool({
      description: 'List files in MinIO storage',
      inputSchema: z.object({
        bucket: z.enum(['chat-images', 'chat-documents', 'chat-knowledge-base', 'chat-projects']),
        folder: z.string().optional().describe('Folder path'),
      }),
      execute: async ({ bucket, folder }) => {
        try {
          const minioService = getMinIOService()
          const { files } = await minioService.listFiles(bucket, folder, 10)
          return {
            files: files.map((f) => ({ name: f.name, size: f.size, uploadedAt: f.uploadedAt })),
            bucket,
            folder,
          }
        } catch (error) {
          console.error('[v0] Error listing files:', error)
          return { error: 'Failed to list files', files: [] }
        }
      },
    }),
  }

  const result = streamText({
    model: selectedModel,
    system: enhancedSystemPrompt,
    messages: await convertToModelMessages(messages),
    tools,
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages: allMessages, isAborted }) => {
      if (isAborted) return
      console.log('[v0] Chat completed with AI SDK')
    },
    consumeSseStream: consumeStream,
  })
}

/**
 * Get system prompt based on agent mode
 */
function getSystemPrompt(mode?: string): string {
  switch (mode) {
    case 'coder':
      return `You are an expert coding assistant specializing in Node.js, TypeScript, React, and modern development practices. Help users write, debug, and explain code. Provide clear, well-commented examples and best practices. When relevant, reference up-to-date documentation and library versions.`

    case 'writer':
      return `You are a creative writing assistant. Help users craft compelling stories, articles, and content with vivid language and engaging narratives. Maintain consistent tone and style throughout the work.`

    case 'analyst':
      return `You are a data analyst assistant. Help users interpret data, create insights, and make data-driven decisions with clear explanations. When possible, reference uploaded data files and visualizations.`

    case 'researcher':
      return `You are a research assistant. Help users find information, synthesize knowledge, and explore topics in depth with proper citations. Reference uploaded documents and knowledge base content when available.`

    default:
      return `You are a helpful AI assistant. Provide clear, accurate, and thoughtful responses to help users with their questions and tasks. Use uploaded files and documents when relevant to provide better assistance.`
  }
}

/**
 * Extract text content from UIMessage
 */
function getMessageContent(msg: UIMessage): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return ''
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}
