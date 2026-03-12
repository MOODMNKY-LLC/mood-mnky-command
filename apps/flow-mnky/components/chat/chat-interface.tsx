'use client'

import { useState, useCallback, useMemo } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, UIMessage } from 'ai'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Menu, PanelLeftClose } from 'lucide-react'

import { ChatSidebar } from './chat-sidebar'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { ModelSelector } from './model-selector'
import { AgentModeSelector } from './agent-mode-selector'
import { ThemeToggle } from './theme-toggle'
import { TempChatSelector } from './temp-chat-selector'

import type { ChatSession, S3File } from '@/lib/chat-store'

interface TempSession {
  id: string
  name: string
  createdAt: Date
}

export function ChatInterface() {
  // Chat sessions state
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [files] = useState<S3File[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // Temporary sessions for OpenAI agents
  const [tempSessions, setTempSessions] = useState<TempSession[]>([
    { id: '1', name: 'Session 1', createdAt: new Date() }
  ])
  const [currentTempSessionId, setCurrentTempSessionId] = useState('1')

  // Model and agent mode
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4o')
  const [agentMode, setAgentMode] = useState('default')
  const [useFlowise, setUseFlowise] = useState(true)

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Initialize chat with AI SDK
  const [input, setInput] = useState('')
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: {
          messages,
          id,
          model: selectedModel,
          agentMode,
          useFlowise,
          sessionId: currentTempSessionId,
        },
      }),
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Get last assistant message for TTS
  const lastAssistantMessage = useMemo(() => {
    const assistantMessages = messages.filter(m => m.role === 'assistant')
    const last = assistantMessages[assistantMessages.length - 1]
    if (!last?.parts) return ''
    return last.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map(p => p.text)
      .join('')
  }, [messages])

  // Handler functions
  const handleSubmit = useCallback(() => {
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')

    // Update session title based on first message
    if (currentSessionId && messages.length === 0) {
      const title = input.slice(0, 30) + (input.length > 30 ? '...' : '')
      setSessions(prev =>
        prev.map(s => s.id === currentSessionId ? { ...s, title } : s)
      )
    }
  }, [input, isLoading, sendMessage, currentSessionId, messages.length])

  const handleNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      model: selectedModel,
      agentMode,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setSessions(prev => [newSession, ...prev])
    setCurrentSessionId(newSession.id)
    setMessages([])
    setSidebarOpen(false)
  }, [selectedModel, agentMode, setMessages])

  const handleSelectSession = useCallback((id: string) => {
    setCurrentSessionId(id)
    const session = sessions.find(s => s.id === id)
    if (session) {
      setMessages(session.messages as UIMessage[])
      setSelectedModel(session.model)
      setAgentMode(session.agentMode)
    }
    setSidebarOpen(false)
  }, [sessions, setMessages])

  const handleDeleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id))
    if (currentSessionId === id) {
      setCurrentSessionId(null)
      setMessages([])
    }
  }, [currentSessionId, setMessages])

  const handleNewTempSession = useCallback(() => {
    const newSession: TempSession = {
      id: crypto.randomUUID(),
      name: `Session ${tempSessions.length + 1}`,
      createdAt: new Date(),
    }
    setTempSessions(prev => [...prev, newSession])
    setCurrentTempSessionId(newSession.id)
    setMessages([])
  }, [tempSessions.length, setMessages])

  const handleDeleteTempSession = useCallback((id: string) => {
    setTempSessions(prev => prev.filter(s => s.id !== id))
    if (currentTempSessionId === id) {
      const remaining = tempSessions.filter(s => s.id !== id)
      if (remaining.length > 0) {
        setCurrentTempSessionId(remaining[0].id)
      } else {
        handleNewTempSession()
      }
    }
  }, [currentTempSessionId, tempSessions, handleNewTempSession])

  const handleFileUpload = useCallback((uploadedFiles: File[]) => {
    // Handle file upload to S3
    console.log('[v0] Files uploaded:', uploadedFiles.map(f => f.name))
  }, [])

  const handleSpeak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  return (
    <div className="flex h-screen bg-background transition-theme">
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        files={files}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 glass-subtle">
          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Desktop sidebar toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent/50"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <PanelLeftClose className={cn(
                'w-5 h-5 transition-transform duration-200',
                !sidebarOpen && 'rotate-180'
              )} />
            </Button>

            {/* Model Selector */}
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />

            {/* Temp Chat Selector */}
            <TempChatSelector
              sessions={tempSessions}
              currentSessionId={currentTempSessionId}
              onSelectSession={setCurrentTempSessionId}
              onNewSession={handleNewTempSession}
              onDeleteSession={handleDeleteTempSession}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Flowise Toggle Button */}
            <Button
              variant={useFlowise ? "default" : "outline"}
              size="sm"
              className="h-9 px-3 text-xs font-medium"
              onClick={() => setUseFlowise(!useFlowise)}
              title={useFlowise ? "Using Flowise (click to switch to AI SDK)" : "Using AI SDK (click to switch to Flowise)"}
            >
              {useFlowise ? "Flowise" : "AI SDK"}
            </Button>

            {/* Agent Mode Selector */}
            <AgentModeSelector
              selectedMode={agentMode}
              onModeChange={setAgentMode}
            />

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </header>

        {/* Messages */}
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          onSpeak={handleSpeak}
        />

        {/* Input */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          onFileUpload={handleFileUpload}
          isLoading={isLoading}
          lastAssistantMessage={lastAssistantMessage}
        />
      </div>
    </div>
  )
}
