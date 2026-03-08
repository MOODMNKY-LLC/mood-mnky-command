import { UIMessage } from 'ai'

export interface ChatSession {
  id: string
  title: string
  messages: UIMessage[]
  model: string
  agentMode: string
  createdAt: Date
  updatedAt: Date
}

export interface SourceDocument {
  id: string
  name: string
  bucket: string
  relevanceScore: number
  content?: string
  metadata?: Record<string, unknown>
}

export interface ChatSessionEnhanced extends ChatSession {
  floWiseSessionId?: string
  sourceDocuments?: SourceDocument[]
  usedFlowise?: boolean
  knowledgeBaseIds?: string[]
}

export interface S3File {
  id: string
  name: string
  type: 'image' | 'document' | 'folder' | 'knowledge'
  size: number
  url: string
  folder?: string
  uploadedAt: Date
  bucket?: string
  objectName?: string
  presignedUrl?: string
}

// In-memory store for demo - replace with actual persistence
let chatSessions: ChatSession[] = []
let files: S3File[] = []

export function createChatSession(model: string = 'openai/gpt-4o', agentMode: string = 'default'): ChatSession {
  const session: ChatSession = {
    id: crypto.randomUUID(),
    title: 'New Chat',
    messages: [],
    model,
    agentMode,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  chatSessions.unshift(session)
  return session
}

export function getChatSessions(): ChatSession[] {
  return chatSessions
}

export function getChatSession(id: string): ChatSession | undefined {
  return chatSessions.find(s => s.id === id)
}

export function updateChatSession(id: string, updates: Partial<ChatSession>): ChatSession | undefined {
  const index = chatSessions.findIndex(s => s.id === id)
  if (index !== -1) {
    chatSessions[index] = { ...chatSessions[index], ...updates, updatedAt: new Date() }
    return chatSessions[index]
  }
  return undefined
}

export function deleteChatSession(id: string): boolean {
  const index = chatSessions.findIndex(s => s.id === id)
  if (index !== -1) {
    chatSessions.splice(index, 1)
    return true
  }
  return false
}

export function getFiles(): S3File[] {
  return files
}

export function addFile(file: Omit<S3File, 'id' | 'uploadedAt'>): S3File {
  const newFile: S3File = {
    ...file,
    id: crypto.randomUUID(),
    uploadedAt: new Date(),
  }
  files.push(newFile)
  return newFile
}

export function deleteFile(id: string): boolean {
  const index = files.findIndex(f => f.id === id)
  if (index !== -1) {
    files.splice(index, 1)
    return true
  }
  return false
}

export const AI_MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Most capable model' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Fast and efficient' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', provider: 'OpenAI', description: 'Latest generation' },
  { id: 'anthropic/claude-opus-4.6', name: 'Claude Opus', provider: 'Anthropic', description: 'Advanced reasoning' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet', provider: 'Anthropic', description: 'Balanced performance' },
  { id: 'google/gemini-3-flash', name: 'Gemini 3 Flash', provider: 'Google', description: 'Ultra fast' },
] as const

export const AGENT_MODES = [
  { id: 'default', name: 'General', icon: 'MessageSquare', description: 'General purpose assistant' },
  { id: 'coder', name: 'Coder', icon: 'Code', description: 'Expert coding help' },
  { id: 'writer', name: 'Writer', icon: 'PenTool', description: 'Creative writing' },
  { id: 'analyst', name: 'Analyst', icon: 'BarChart3', description: 'Data analysis' },
  { id: 'researcher', name: 'Researcher', icon: 'Search', description: 'In-depth research' },
] as const
