import { requireUser } from '@/lib/auth/require-user'
import { getChatflow, listChatflows } from '@/lib/flowise/client'
import {
  getChatflowConfigSummary,
  getChatflowChatbotUIConfig,
  getChatflowToolsFromFlowData,
  getChatflowConfiguredModel,
  getChatflowSystemMessage,
} from '@/lib/flowise/flow-config'
import { getCurrentUserProfile } from '@/lib/chat/session-store'

/**
 * GET /api/chat/chatflows/[id]
 * Returns minimal config summary for the chatflow (type, node summary, suggested vars).
 * Only for chatflows the user is allowed to see. No raw flowData exposed.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser()
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  if (!id?.trim()) {
    return Response.json({ error: 'Chatflow ID required' }, { status: 400 })
  }

  try {
    const [profile, chatflows] = await Promise.all([
      getCurrentUserProfile(auth.userId),
      listChatflows(),
    ])
    const visible =
      profile.role === 'admin'
        ? chatflows
        : chatflows.filter((cf) => cf.deployed ?? cf.isPublic ?? false)
    const allowed = visible.some((cf) => cf.id === id.trim())
    if (!allowed) {
      return Response.json({ error: 'Chatflow not found or not accessible' }, { status: 404 })
    }

    const chatflow = await getChatflow(id.trim())
    const config = getChatflowConfigSummary(chatflow)
    const chatbotUi = getChatflowChatbotUIConfig(chatflow)
    const tools = getChatflowToolsFromFlowData(chatflow)
    const configuredModel = getChatflowConfiguredModel(chatflow)
    const systemMessage = getChatflowSystemMessage(chatflow)
    return Response.json({
      id: chatflow.id,
      name: chatflow.name,
      type: config.type,
      flowSummary: {
        nodeCount: config.nodeCount,
        nodeTypes: config.nodeTypes,
      },
      configuredModel: configuredModel ?? undefined,
      systemMessage: systemMessage ?? undefined,
      suggestedVars: config.suggestedVars,
      tools: tools.length > 0 ? tools : undefined,
      starterPrompts: chatbotUi.starterPrompts.length > 0 ? chatbotUi.starterPrompts : undefined,
      welcomeMessage: chatbotUi.welcomeMessage ?? undefined,
      followUpPrompts: chatbotUi.followUpPrompts.length > 0 ? chatbotUi.followUpPrompts : undefined,
    })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to load chatflow config' },
      { status: 502 }
    )
  }
}
