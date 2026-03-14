// Main chat interface with streaming support and temporary chat mode
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Menu, PanelLeftClose, EyeOff, Settings, Sparkles, Flame, Hash, FileText } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ChatSidebar } from './chat-sidebar'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { ChatHeaderSelectors } from './chat-header-selectors'
import { ThemeToggle } from './theme-toggle'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { RealtimeAvatarStack } from '@/components/realtime-avatar-stack'
import { useUserRole } from '@/hooks/use-user-role'
import { AI_MODELS, type AgentModeId, type ChatSession, type ModelId, type SourceDocument } from '@/lib/types'

export interface FlowiseChatflow {
  id: string
  name: string
  description?: string
}

export interface ChatMessageAttachment {
  id: string
  url: string
  filename: string
  mediaType: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
  sourceDocuments?: SourceDocument[]
  isStreaming?: boolean
  /** User message attachments (object URLs for display) */
  attachments?: ChatMessageAttachment[]
}

interface ChatflowsResponse {
  chatflows: Array<FlowiseChatflow & { deployed?: boolean }>
  defaultChatflowId: string | null
  allowedOpenAIModels: string[] | null
  role: string
}

interface PersistedSessionResponse {
  id: string
  title: string
  chatflow_id: string | null
  chatflow_name: string | null
  flowise_chat_id: string | null
  pinned: boolean
  archived: boolean
  message_count: number
  created_at: string
  updated_at: string
}

interface PersistedMessageResponse {
  id: string
  role: 'user' | 'assistant'
  content: string
  source_documents: SourceDocument[] | null
  created_at: string
}

function toChatSession(session: PersistedSessionResponse): ChatSession {
  return {
    id: session.id,
    title: session.title,
    chatflowId: session.chatflow_id ?? '',
    chatflowName: session.chatflow_name ?? undefined,
    flowise_chat_id: session.flowise_chat_id ?? undefined,
    isPinned: session.pinned,
    isArchived: session.archived,
    isPersisted: true,
    messageCount: session.message_count,
    createdAt: new Date(session.created_at),
    updatedAt: new Date(session.updated_at),
  }
}

function toChatMessage(message: PersistedMessageResponse): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: new Date(message.created_at),
    sourceDocuments: message.source_documents ?? undefined,
  }
}

export function ChatShell() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatflows, setChatflows] = useState<FlowiseChatflow[]>([])
  const [selectedChatflowId, setSelectedChatflowId] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<ModelId>('openai/gpt-4o')
  const [agentMode, setAgentMode] = useState<AgentModeId>('default')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isStreaming, setIsStreaming] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'healthy' | 'error'>('unknown')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(4096)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [streamingEnabled, setStreamingEnabled] = useState(true)
  const [tempChat, setTempChat] = useState(false)
  const [allowedOpenAIModels, setAllowedOpenAIModels] = useState<string[] | null>(null)
  const { isAdmin, userId } = useUserRole()
  const skipNextMessageLoadSessionIdRef = useRef<string | null>(null)

  const applySessionUpdate = useCallback((sessionId: string, updater: (session: ChatSession) => ChatSession) => {
    setSessions((prev) => prev.map((session) => (session.id === sessionId ? updater(session) : session)))
    setCurrentSession((prev) => (prev?.id === sessionId ? updater(prev) : prev))
  }, [])

  const persistSessionPatch = useCallback(
    async (sessionId: string, updates: Record<string, unknown>) => {
      const res = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        throw new Error(`Failed to update chat session (${res.status})`)
      }
      const data = (await res.json()) as { session: PersistedSessionResponse }
      const next = toChatSession(data.session)
      applySessionUpdate(sessionId, () => next)
      return next
    },
    [applySessionUpdate]
  )

  useEffect(() => {
    let isCancelled = false

    async function loadInitialState() {
      try {
        const [chatflowRes, sessionsRes] = await Promise.all([
          fetch('/api/chat/chatflows'),
          fetch('/api/chat/sessions'),
        ])

        if (!chatflowRes.ok) {
          throw new Error(`Failed to load chatflows (${chatflowRes.status})`)
        }

        const chatflowData = (await chatflowRes.json()) as ChatflowsResponse
        const nextChatflows = chatflowData.chatflows ?? []
        const urlChatflowId =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('chatflowId')
            : null
        const defaultChatflowId =
          (urlChatflowId && nextChatflows.some((chatflow) => chatflow.id === urlChatflowId)
            ? urlChatflowId
            : chatflowData.defaultChatflowId) ?? nextChatflows[0]?.id ?? ''

        const nextSessions = sessionsRes.ok
          ? (((await sessionsRes.json()) as { sessions?: PersistedSessionResponse[] }).sessions ?? []).map(toChatSession)
          : []

        if (isCancelled) return

        setChatflows(nextChatflows)
        setAllowedOpenAIModels(chatflowData.allowedOpenAIModels)
        setSelectedChatflowId(defaultChatflowId)
        setSessions(nextSessions)
        setCurrentSession(nextSessions[0] ?? null)
        setConnectionStatus('healthy')
      } catch (err) {
        console.error('[ChatShell] Failed to load initial state:', err)
        if (!isCancelled) {
          setConnectionStatus('error')
        }
      }
    }

    loadInitialState()
    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    if (!allowedOpenAIModels?.length) return
    if (!allowedOpenAIModels.includes(selectedModel)) {
      const nextModel = AI_MODELS.find((model) => allowedOpenAIModels.includes(model.id))
      if (nextModel) setSelectedModel(nextModel.id)
    }
  }, [allowedOpenAIModels, selectedModel])

  useEffect(() => {
    if (!currentSession || currentSession.isTemporary || !currentSession.isPersisted) return

    let isCancelled = false
    const sessionId = currentSession.id

    if (skipNextMessageLoadSessionIdRef.current === sessionId) {
      skipNextMessageLoadSessionIdRef.current = null
      return
    }

    async function loadMessages() {
      try {
        const res = await fetch(`/api/chat/sessions/${sessionId}/messages`)
        if (!res.ok) {
          throw new Error(`Failed to load messages (${res.status})`)
        }

        const data = (await res.json()) as { messages?: PersistedMessageResponse[] }
        if (!isCancelled) {
          setMessages((data.messages ?? []).map(toChatMessage))
        }
      } catch (err) {
        console.error('[ChatShell] Failed to load messages:', err)
        if (!isCancelled) {
          setMessages([])
        }
      }
    }

    loadMessages()
    return () => {
      isCancelled = true
    }
  }, [currentSession?.id, currentSession?.isTemporary, currentSession?.isPersisted])

  useEffect(() => {
    setTempChat(Boolean(currentSession?.isTemporary))
  }, [currentSession?.id, currentSession?.isTemporary])

  useEffect(() => {
    if (currentSession?.chatflowId) {
      setSelectedChatflowId(currentSession.chatflowId)
    }
  }, [currentSession?.id, currentSession?.chatflowId])

  const handleNewChat = useCallback(() => {
    const session: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      chatflowId: selectedChatflowId,
      chatflowName: chatflows.find(c => c.id === selectedChatflowId)?.name,
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
      isTemporary: tempChat,
      isPersisted: false,
    }
    setSessions(prev => [session, ...prev])
    setCurrentSession(session)
    setMessages([])
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }, [selectedChatflowId, chatflows, tempChat])

  const handleSelectSession = useCallback((id: string) => {
    const s = sessions.find(s => s.id === id)
    if (s) {
      setCurrentSession(s)
      if (window.innerWidth < 1024) setSidebarOpen(false)
    }
  }, [sessions])

  const handleDeleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id))
    if (currentSession?.id === id) { setCurrentSession(null); setMessages([]) }
    const target = sessions.find((session) => session.id === id)
    if (target && !target.isTemporary) {
      fetch(`/api/chat/sessions/${id}`, { method: 'DELETE' }).catch((err) => {
        console.error('[ChatShell] Failed to delete chat session:', err)
      })
    }
  }, [currentSession, sessions])

  const handleRenameSession = useCallback((id: string, title: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s))
    if (currentSession?.id === id) setCurrentSession(prev => prev ? { ...prev, title } : prev)
    const target = sessions.find((session) => session.id === id)
    if (target && !target.isTemporary) {
      persistSessionPatch(id, { title }).catch((err) => {
        console.error('[ChatShell] Failed to rename chat session:', err)
      })
    }
  }, [currentSession, persistSessionPatch, sessions])

  const handlePinSession = useCallback((id: string, pinned: boolean) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, isPinned: pinned } : s))
    const target = sessions.find((session) => session.id === id)
    if (target && !target.isTemporary) {
      persistSessionPatch(id, { pinned }).catch((err) => {
        console.error('[ChatShell] Failed to pin chat session:', err)
      })
    }
  }, [persistSessionPatch, sessions])

  const handleArchiveSession = useCallback((id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, isArchived: true } : s))
    if (currentSession?.id === id) {
      setCurrentSession(null)
      setMessages([])
    }
    const target = sessions.find((session) => session.id === id)
    if (target && !target.isTemporary) {
      persistSessionPatch(id, { archived: true }).catch((err) => {
        console.error('[ChatShell] Failed to archive chat session:', err)
      })
    }
  }, [currentSession, persistSessionPatch, sessions])

  /** Phase 3 Checkpoint: restore conversation to this message (truncate after it) */
  const handleRestoreToMessage = useCallback((messageId: string) => {
    setMessages(prev => {
      const idx = prev.findIndex(m => m.id === messageId)
      if (idx === -1) return prev
      return prev.slice(0, idx + 1)
    })
  }, [])

  const handleSubmit = useCallback(async (text: string, files?: File[], options?: { enabledTools: string[] }) => {
    const hasText = text.trim().length > 0
    const hasFiles = (files?.length ?? 0) > 0
    if ((!hasText && !hasFiles) || isStreaming || !selectedChatflowId) return

    const displayContent = hasText ? text : (hasFiles ? `Sent ${files!.length} file(s)` : '')
    const questionForApi = hasText ? text : (hasFiles ? 'What do you see in the attached image(s)?' : '')

    let session = currentSession
    if (!session) {
      session = {
        id: crypto.randomUUID(),
        title: (text.slice(0, 50) || (hasFiles ? 'Image' : '')).trim() || 'New Chat',
        chatflowId: selectedChatflowId,
        chatflowName: chatflows.find(c => c.id === selectedChatflowId)?.name,
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: 0,
        isTemporary: tempChat,
        isPersisted: false,
      }
      setSessions(prev => [session!, ...prev])
      setCurrentSession(session)
    }

    if (!session.isTemporary && !session.isPersisted && userId) {
        const createRes = await fetch('/api/chat/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: session.title,
            chatflowId: session.chatflowId,
            chatflowName: session.chatflowName,
            flowiseChatId: session.flowise_chat_id ?? null,
          }),
        })

        if (!createRes.ok) {
          throw new Error(`Failed to create chat session (${createRes.status})`)
        }

        const created = (await createRes.json()) as { session: PersistedSessionResponse }
        session = toChatSession(created.session)
        skipNextMessageLoadSessionIdRef.current = session.id
        setSessions((prev) => [session!, ...prev.filter((item) => item.id !== currentSession?.id)])
        setCurrentSession(session)
    }

    // Flowise expects uploads[].data to be the full data URL (data:image/png;base64,...)
    // Create display blob URLs immediately (before any async) so images render in the message
    const userMessageId = crypto.randomUUID()
    const attachmentDisplays: ChatMessageAttachment[] = hasFiles
      ? files!.map((f) => ({
          id: crypto.randomUUID(),
          url: URL.createObjectURL(f),
          filename: f.name,
          mediaType: f.type || 'application/octet-stream',
        }))
      : []
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: displayContent,
      createdAt: new Date(),
      ...(attachmentDisplays.length ? { attachments: attachmentDisplays } : {}),
    }
    setMessages(prev => [...prev, userMsg])

    // Flowise expects uploads[].data as full data URL (data:image/png;base64,...)
    const uploads = hasFiles
      ? await Promise.all(
          files!.map((file) =>
            new Promise<{ data: string; type: string; name: string; mime: string }>((resolve, reject) => {
              const r = new FileReader()
              r.onload = () => {
                const dataUrl = r.result as string
                resolve({
                  data: dataUrl,
                  type: 'file',
                  name: file.name,
                  mime: file.type || 'application/octet-stream',
                })
              }
              r.onerror = () => reject(r.error)
              r.readAsDataURL(file)
            })
          )
        )
      : undefined

    // Add assistant placeholder
    const assistantId = crypto.randomUUID()
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: new Date(),
      isStreaming: true,
    }
    setMessages(prev => [...prev, assistantMsg])
    setIsStreaming(true)

    try {
      const res = await fetch('/api/chat/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatflowId: selectedChatflowId,
          question: questionForApi,
          chatId: session.flowise_chat_id,
          streaming: streamingEnabled,
          overrideConfig: {
            temperature,
            maxTokens,
            systemMessage: systemPrompt || undefined,
            vars: {
              agentMode,
              modelOverride: selectedModel,
              enabledTools: options?.enabledTools ?? [],
            },
          },
          ...(uploads?.length ? { uploads } : {}),
        }),
      })

      if (!res.ok) {
        const errBody = await res.text().catch(() => res.statusText)
        throw new Error(errBody ? `HTTP ${res.status}: ${errBody.slice(0, 200)}` : `HTTP ${res.status}`)
      }
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let flowise_chat_id = session.flowise_chat_id
      let rawBuffer = ''
      // Flowise SSE format per docs: separate "event: token" and "data: <raw text>" lines (not JSON in data)
      let currentEvent = ''

      function processSSELine(line: string): void {
        const trimmed = line.replace(/\r$/, '').trim()
        if (!trimmed) return
        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.slice(6).trim()
          return
        }
        if (trimmed.startsWith('data:')) {
          const data = trimmed.slice(5).trim()
          if (currentEvent === 'token') {
            if (data) {
              try {
                const parsed = JSON.parse(data) as unknown
                accumulated += typeof parsed === 'string' ? parsed : data
              } catch {
                accumulated += data
              }
            }
            return
          }
          if (currentEvent === 'metadata' && data && !flowise_chat_id) {
            try {
              const meta = JSON.parse(data) as { chatId?: string }
              if (meta.chatId) flowise_chat_id = meta.chatId
            } catch {
              // ignore
            }
            return
          }
          if (currentEvent === 'end') return
          // Fallback: some Flowise versions send data as JSON {"event":"token","data":"..."}
          if (!data || data === '[DONE]') return
          try {
            const frame = JSON.parse(data) as Record<string, unknown>
            const innerEvent = (frame.event as string) ?? ''
            const innerData = frame.data
            const tokenStr = frame.token as string | undefined
            if (innerEvent === 'token' && typeof innerData === 'string' && innerData) {
              accumulated += innerData
            } else if (typeof tokenStr === 'string' && tokenStr) {
              accumulated += tokenStr
            } else if (innerEvent === 'metadata' && typeof innerData === 'object' && innerData && !flowise_chat_id) {
              const meta = innerData as { chatId?: string }
              if (meta.chatId) flowise_chat_id = meta.chatId
            }
          } catch {
            if (currentEvent === 'token') accumulated += data
            else if (!accumulated) {
              try {
                const obj = JSON.parse(data) as { text?: string }
                if (typeof obj?.text === 'string') accumulated += obj.text
              } catch {
                if (data) accumulated += data
              }
            } else if (data) accumulated += data
          }
        } else if (trimmed && !accumulated) {
          try {
            const obj = JSON.parse(trimmed) as { text?: string }
            if (typeof obj?.text === 'string') accumulated += obj.text
          } catch {
            // ignore
          }
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (value?.length) rawBuffer += decoder.decode(value, { stream: true })
        const lines = rawBuffer.split(/\r?\n/)
        rawBuffer = lines.pop() ?? ''

        for (const line of lines) processSSELine(line)

        if (accumulated) {
          flushSync(() => {
            setMessages(prev =>
              prev.map(m => m.id === assistantId ? { ...m, content: accumulated } : m)
            )
          })
        }
        if (done) break
      }

      if (rawBuffer.trim()) processSSELine(rawBuffer.trim())

      if (!accumulated && rawBuffer.trim()) {
        try {
          const obj = JSON.parse(rawBuffer.trim()) as { text?: string }
          if (typeof obj?.text === 'string') accumulated = obj.text
        } catch {
          // ignore
        }
      }

      const finalContent = accumulated || '(no response)'
      const useTypewriter =
        !streamingEnabled &&
        finalContent !== '(no response)' &&
        finalContent.length > 0

      if (useTypewriter) {
        const msPerTick = 10
        const charsPerTick = 1
        let revealIdx = Math.min(charsPerTick, finalContent.length)
        flushSync(() => {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId ? { ...m, content: finalContent.slice(0, revealIdx) } : m
            )
          )
        })
        const tick = () => {
          revealIdx = Math.min(revealIdx + charsPerTick, finalContent.length)
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId ? { ...m, content: finalContent.slice(0, revealIdx) } : m
            )
          )
          if (revealIdx < finalContent.length) {
            setTimeout(tick, msPerTick)
          } else {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, isStreaming: false, content: finalContent }
                  : m
              )
            )
            setIsStreaming(false)
          }
        }
        setTimeout(tick, msPerTick)
      } else {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, isStreaming: false, content: finalContent }
              : m
          )
        )
      }

      if (flowise_chat_id && session.flowise_chat_id !== flowise_chat_id) {
        applySessionUpdate(session.id, (existing) => ({
          ...existing,
          flowise_chat_id,
        }))
      }

      if (!session.isTemporary) {
        await fetch(`/api/chat/sessions/${session.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'user', content: displayContent },
              { role: 'assistant', content: finalContent },
            ],
          }),
        })

        await persistSessionPatch(session.id, {
          title:
            (session.messageCount ?? 0) === 0
              ? (text.slice(0, 50) || (hasFiles ? 'New Chat' : 'New Chat')).trim() || 'New Chat'
              : session.title,
          flowiseChatId: flowise_chat_id ?? session.flowise_chat_id ?? null,
          messageCount: (session.messageCount ?? 0) + 2,
          lastMessageAt: new Date().toISOString(),
          chatflowId: selectedChatflowId,
          chatflowName: chatflows.find((chatflow) => chatflow.id === selectedChatflowId)?.name ?? null,
        })
      }
    } catch (err) {
      console.error('[handleSubmit]', err)
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, isStreaming: false, content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` }
            : m
        )
      )
    } finally {
      setIsStreaming(false)
    }
  }, [
    agentMode,
    applySessionUpdate,
    chatflows,
    currentSession,
    isStreaming,
    maxTokens,
    persistSessionPatch,
    selectedChatflowId,
    selectedModel,
    sessions,
    streamingEnabled,
    systemPrompt,
    tempChat,
    temperature,
    userId,
  ])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background safe-area-inset">
      <ChatSidebar
        sessions={sessions.filter(s => !s.isArchived)}
        currentSessionId={currentSession?.id ?? null}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onPinSession={handlePinSession}
        onArchiveSession={handleArchiveSession}
        chatflows={chatflows}
        selectedChatflowId={selectedChatflowId}
        onSelectChatflow={setSelectedChatflowId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        connectionStatus={connectionStatus}
        isAdmin={isAdmin}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center px-2 sm:px-3 py-2 border-b border-border/50 glass-subtle shrink-0 gap-1.5 sm:gap-2 safe-area-top no-tap-highlight">
          {/* Sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 sm:h-8 sm:w-8 shrink-0 text-muted-foreground hover:text-foreground touch-target"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>

          {/* Left cluster: Chatflow + Model selectors */}
          <ChatHeaderSelectors
            chatflows={chatflows}
            selectedChatflowId={selectedChatflowId}
            onChatflowChange={setSelectedChatflowId}
            allowedModelIds={allowedOpenAIModels}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            selectedMode={agentMode}
            onModeChange={setAgentMode}
            temperature={temperature}
            onTemperatureChange={setTemperature}
            maxTokens={maxTokens}
            onMaxTokensChange={setMaxTokens}
            systemPrompt={systemPrompt}
            onSystemPromptChange={setSystemPrompt}
            streaming={streamingEnabled}
            onStreamingChange={setStreamingEnabled}
            tempChat={tempChat}
            onTempChatChange={setTempChat}
          />

          {/* Right cluster: Presence in this chat + Temp chat toggle + Config gear + Theme toggle */}
          <div className="ml-auto flex items-center gap-1 sm:gap-1.5 shrink-0">
            {currentSession && (
              <div className="hidden sm:flex items-center gap-1.5 pr-1" title="Who's in this chat">
                <RealtimeAvatarStack roomName={`flow-mnky:session:${currentSession.id}`} />
              </div>
            )}
            {/* Temp chat visible toggle button - icon only on mobile */}
            <Button
              variant={tempChat ? 'secondary' : 'ghost'}
              size="icon"
              className={cn(
                'h-9 w-9 sm:h-8 sm:w-auto sm:gap-1.5 sm:px-2.5 text-xs font-medium rounded-lg touch-target',
                tempChat
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setTempChat(t => !t)}
              title={tempChat ? 'Temporary chat on — messages not saved' : 'Enable temporary chat'}
            >
              <EyeOff className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">{tempChat ? 'Temp' : 'Temp'}</span>
            </Button>

            {/* Config gear popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 sm:h-8 sm:w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 shrink-0 touch-target"
                  title="Chat configuration"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-4">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Chat Configuration</h3>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium flex items-center gap-2">
                      <Flame className="w-3 h-3" />
                      Temperature
                      <span className="text-muted-foreground font-normal">({temperature.toFixed(2)})</span>
                    </Label>
                    <Slider value={[temperature]} onValueChange={([v]) => setTemperature(v)} min={0} max={2} step={0.1} className="w-full" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium flex items-center gap-2">
                      <Hash className="w-3 h-3" />
                      Max Tokens
                      <span className="text-muted-foreground font-normal">({maxTokens})</span>
                    </Label>
                    <Slider value={[maxTokens]} onValueChange={([v]) => setMaxTokens(v)} min={100} max={16000} step={100} className="w-full" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium flex items-center gap-2">
                      <FileText className="w-3 h-3" />
                      System Prompt
                    </Label>
                    <textarea
                      value={systemPrompt}
                      onChange={e => setSystemPrompt(e.target.value)}
                      placeholder="Custom system instructions..."
                      className="w-full h-24 px-2 py-1.5 text-xs bg-muted border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    />
                  </div>

                  <div className="space-y-3 pt-1 border-t border-border/40">
                    <div className="flex items-center justify-between pt-2">
                      <Label className="text-xs font-medium flex items-center gap-2 cursor-pointer">
                        <Sparkles className="w-3 h-3" />
                        Streaming responses
                      </Label>
                      <Switch checked={streamingEnabled} onCheckedChange={setStreamingEnabled} />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <ThemeToggle />
          </div>
        </header>

        <ChatMessages
          messages={messages}
          isStreaming={isStreaming}
          tempChat={tempChat}
          onSuggestionClick={(s) => handleSubmit(s)}
          onRestoreToMessage={handleRestoreToMessage}
        />

        <ChatInput
          onSubmit={handleSubmit}
          isLoading={isStreaming}
          disabled={!selectedChatflowId}
        />
      </div>

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  )
}
