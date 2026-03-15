/**
 * Parse Flowise flowData to derive config summary for chat UI and overrideConfig.
 * Used to inspect chatflow type, node structure, and common overridable vars.
 * Also parses chatbotConfig and followUpPrompts for starter prompts and welcome message.
 */

export interface ChatflowConfigSummary {
  type: 'CHATFLOW' | 'MULTIAGENT'
  nodeCount: number
  nodeTypes: string[]
  nodeIds: string[]
  /** Var names often used in Flowise flows; app can pass these in overrideConfig.vars */
  suggestedVars: string[]
}

/** UI config from Flowise chatflow (starter prompts, welcome message, follow-up prompts). */
export interface ChatflowChatbotUIConfig {
  starterPrompts: string[]
  welcomeMessage: string | null
  followUpPrompts: string[]
}

/** Tool entry derived from flowData (nodes connected to agent's tools input). */
export interface ChatflowToolEntry {
  id: string
  label: string
  description?: string
}

const COMMON_FLOW_VARS = [
  'agentMode',
  'modelOverride',
  'enabledTools',
  'systemMessage',
  'temperature',
  'maxTokens',
]

/**
 * Extract a safe config summary from a full Flowise chatflow (id, name, flowData, type).
 * Does not expose raw flowData to the client.
 */
export function getChatflowConfigSummary(chatflow: {
  id: string
  name?: string
  type?: string
  flowData?: string | null
}): ChatflowConfigSummary {
  const type: 'CHATFLOW' | 'MULTIAGENT' =
    chatflow.type === 'MULTIAGENT' ? 'MULTIAGENT' : 'CHATFLOW'

  let nodeCount = 0
  const nodeTypes: string[] = []
  const nodeIds: string[] = []
  const suggestedVars = [...COMMON_FLOW_VARS]

  const flowData = chatflow.flowData?.trim()
  if (flowData) {
    try {
      const data = JSON.parse(flowData) as Record<string, unknown>
      const nodes = (data?.nodes ?? data?.node ?? []) as Array<Record<string, unknown>>
      if (Array.isArray(nodes)) {
        nodeCount = nodes.length
        for (const node of nodes) {
          const id = node.id as string | undefined
          const nodeType = (node.type ?? (node.data as Record<string, unknown>)?.type ?? id) as string
          if (id) nodeIds.push(id)
          if (nodeType && !nodeTypes.includes(nodeType)) nodeTypes.push(nodeType)
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  return {
    type,
    nodeCount,
    nodeTypes,
    nodeIds,
    suggestedVars,
  }
}

/**
 * Parse Flowise chatbotConfig and followUpPrompts for chat UI (starter prompts, welcome message, follow-up prompts).
 * Flowise stores these in the chatflow config dialog; embed theme uses theme.chatWindow.starterPrompts / welcomeMessage.
 * Backend chatbotConfig may be JSON with chatWindow.starterPrompts, chatWindow.welcomeMessage, or flat keys.
 */
export function getChatflowChatbotUIConfig(chatflow: {
  chatbotConfig?: string | null
  followUpPrompts?: string | null
}): ChatflowChatbotUIConfig {
  const result: ChatflowChatbotUIConfig = {
    starterPrompts: [],
    welcomeMessage: null,
    followUpPrompts: [],
  }

  const rawConfig = chatflow.chatbotConfig?.trim()
  if (rawConfig) {
    try {
      const config = JSON.parse(rawConfig) as Record<string, unknown>
      const chatWindow = config?.chatWindow as Record<string, unknown> | undefined
      const flat = config as Record<string, unknown>

      // Embed theme shape: theme.chatWindow.starterPrompts / welcomeMessage
      const starter = (chatWindow?.starterPrompts ?? flat.starterPrompts) as string[] | undefined
      if (Array.isArray(starter) && starter.length > 0) {
        result.starterPrompts = starter.filter((s): s is string => typeof s === 'string')
      }

      const welcome = (chatWindow?.welcomeMessage ?? flat.welcomeMessage) as string | undefined
      if (typeof welcome === 'string' && welcome.trim()) {
        result.welcomeMessage = welcome.trim()
      }
    } catch {
      // ignore parse errors
    }
  }

  const rawFollow = chatflow.followUpPrompts?.trim()
  if (rawFollow) {
    try {
      const parsed = JSON.parse(rawFollow) as unknown
      const arr = Array.isArray(parsed) ? parsed : (typeof parsed === 'string' ? [parsed] : [])
      result.followUpPrompts = arr.filter((s): s is string => typeof s === 'string')
    } catch {
      // comma-separated fallback
      result.followUpPrompts = rawFollow.split(',').map((s) => s.trim()).filter(Boolean)
    }
  }

  return result
}

/**
 * Get the default system message from the first agent node (e.g. Tool Agent) in the flow.
 * Used to prefill the chat configuration panel; user can clear or edit to override.
 */
export function getChatflowSystemMessage(chatflow: {
  flowData?: string | null
}): string | null {
  const flowData = chatflow.flowData?.trim()
  if (!flowData) return null
  try {
    const data = JSON.parse(flowData) as Record<string, unknown>
    const nodes = (data?.nodes ?? data?.node ?? []) as Array<Record<string, unknown>>
    if (!Array.isArray(nodes)) return null
    for (const node of nodes) {
      const dataBlock = (node.data ?? node) as Record<string, unknown> | undefined
      const type = (dataBlock?.type ?? node.type) as string
      const name = (dataBlock?.name as string) ?? ''
      const isAgent =
        type === 'AgentExecutor' ||
        type === 'Tool Agent' ||
        name === 'toolAgent' ||
        name === 'agentExecutor'
      if (!isAgent) continue
      const inputs = dataBlock?.inputs as Record<string, unknown> | undefined
      const systemMessage = inputs?.systemMessage as string | undefined
      if (typeof systemMessage === 'string') return systemMessage.trim() || null
    }
    return null
  } catch {
    return null
  }
}

/**
 * Get the configured model name from the first ChatOpenAI (or similar) node in the flow.
 * Used for read-only display in the chat header; model changes are done in Flowise or admin.
 */
export function getChatflowConfiguredModel(chatflow: {
  flowData?: string | null
}): string | null {
  const flowData = chatflow.flowData?.trim()
  if (!flowData) return null
  try {
    const data = JSON.parse(flowData) as Record<string, unknown>
    const nodes = (data?.nodes ?? data?.node ?? []) as Array<Record<string, unknown>>
    if (!Array.isArray(nodes)) return null
    for (const node of nodes) {
      const dataBlock = (node.data ?? node) as Record<string, unknown> | undefined
      const type = (dataBlock?.type ?? node.type) as string
      const name = (dataBlock?.name as string) ?? ''
      const isChatModel =
        type === 'ChatOpenAI' ||
        type === 'ChatAnthropic' ||
        type === 'ChatGoogleGenerativeAI' ||
        name === 'chatOpenAI' ||
        name === 'chatAnthropic' ||
        name === 'chatGoogleGenerativeAI'
      if (!isChatModel) continue
      const inputs = dataBlock?.inputs as Record<string, unknown> | undefined
      const modelName = inputs?.modelName as string | undefined
      if (typeof modelName === 'string' && modelName.trim()) return modelName.trim()
    }
    return null
  } catch {
    return null
  }
}

/**
 * Derive list of tools from flowData by finding nodes connected to an agent's "tools" input.
 * Edges target handles like "toolAgent_0-input-tools-Tool"; source node ids and labels are collected.
 */
export function getChatflowToolsFromFlowData(chatflow: {
  flowData?: string | null
}): ChatflowToolEntry[] {
  const flowData = chatflow.flowData?.trim()
  if (!flowData) return []
  try {
    const data = JSON.parse(flowData) as Record<string, unknown>
    const nodes = (data?.nodes ?? data?.node ?? []) as Array<Record<string, unknown>>
    const edges = (data?.edges ?? data?.edge ?? []) as Array<Record<string, unknown>>
    if (!Array.isArray(nodes) || !Array.isArray(edges)) return []

    const toolSourceIds = new Set<string>()
    for (const edge of edges) {
      const targetHandle = (edge.targetHandle as string) ?? ''
      if (targetHandle.includes('-input-tools-') || targetHandle.endsWith('-tools-Tool')) {
        const src = edge.source as string
        if (src) toolSourceIds.add(src)
      }
    }

    const nodeById = new Map<string, Record<string, unknown>>()
    for (const node of nodes) {
      const id = node.id as string
      if (id) nodeById.set(id, node)
    }

    const result: ChatflowToolEntry[] = []
    for (const id of toolSourceIds) {
      const node = nodeById.get(id)
      const dataBlock = (node?.data ?? node) as Record<string, unknown> | undefined
      const label =
        (dataBlock?.label as string) ??
        (dataBlock?.name as string) ??
        (dataBlock?.type as string) ??
        id
      const description = dataBlock?.description as string | undefined
      result.push({ id, label: String(label), description })
    }
    return result.sort((a, b) => a.label.localeCompare(b.label))
  } catch {
    return []
  }
}
