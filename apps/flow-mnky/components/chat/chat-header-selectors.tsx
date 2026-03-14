// Chat header with model/chatflow selector
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Sparkles, Brain, Zap, ChevronDown, Bot, Check } from 'lucide-react'
import { AI_MODELS } from '@/lib/types'
import type { ModelId, AgentModeId } from '@/lib/types'
import type { FlowiseChatflow } from './chat-shell'

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  OpenAI:    <Sparkles className="w-3 h-3" />,
  Anthropic: <Brain className="w-3 h-3" />,
  Google:    <Zap className="w-3 h-3" />,
}

const AGENT_MODES = [
  { id: 'default', label: 'Default', description: 'Standard agent mode' },
] as const

interface ChatHeaderSelectorsProps {
  chatflows: FlowiseChatflow[]
  selectedChatflowId: string
  onChatflowChange: (id: string) => void
  allowedModelIds?: string[] | null
  selectedModel: ModelId
  onModelChange: (id: ModelId) => void
  selectedMode: AgentModeId
  onModeChange: (id: AgentModeId) => void
  temperature: number
  onTemperatureChange: (temp: number) => void
  maxTokens: number
  onMaxTokensChange: (max: number) => void
  systemPrompt: string
  onSystemPromptChange: (prompt: string) => void
  streaming: boolean
  onStreamingChange: (enabled: boolean) => void
  tempChat: boolean
  onTempChatChange: (enabled: boolean) => void
}

export function ChatHeaderSelectors({
  chatflows,
  selectedChatflowId,
  onChatflowChange,
  allowedModelIds,
  selectedModel,
  onModelChange,
  selectedMode,
  onModeChange,
  temperature,
  onTemperatureChange,
  maxTokens,
  onMaxTokensChange,
  systemPrompt,
  onSystemPromptChange,
  streaming,
  onStreamingChange,
  tempChat,
  onTempChatChange,
}: ChatHeaderSelectorsProps) {
  const availableModels = AI_MODELS.filter((model) => !allowedModelIds?.length || allowedModelIds.includes(model.id))
  const currentModel = availableModels.find(m => m.id === selectedModel) ?? availableModels[0] ?? AI_MODELS[0]
  const currentMode = AGENT_MODES.find(m => m.id === selectedMode) ?? AGENT_MODES[0]
  const currentChatflow = chatflows.find(c => c.id === selectedChatflowId)

  const byProvider = availableModels.reduce<Record<string, typeof AI_MODELS[number][]>>((acc, m) => {
    ;(acc[m.provider] ??= []).push(m)
    return acc
  }, {})

  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* Chatflow selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-8 gap-1.5 px-2.5 rounded-lg border border-border/30 bg-transparent hover:bg-accent/50 text-sm font-medium max-w-48 min-w-0"
          >
            <Bot className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {currentChatflow?.name ?? 'Select chatflow'}
            </span>
            <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Flowise Chatflows</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {chatflows.length === 0 ? (
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              No chatflows available
            </DropdownMenuItem>
          ) : (
            chatflows.map(cf => (
              <DropdownMenuItem
                key={cf.id}
                onClick={() => onChatflowChange(cf.id)}
                className={cn(selectedChatflowId === cf.id && 'bg-accent')}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{cf.name}</span>
                  {cf.description && (
                    <span className="text-xs text-muted-foreground">{cf.description}</span>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-4" />

      {/* Model override dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-8 gap-1.5 px-2.5 rounded-lg border border-border/30 bg-transparent hover:bg-accent/50 text-sm font-medium"
          >
            {PROVIDER_ICONS[currentModel.provider]}
            <span className="hidden sm:inline">{currentModel.name}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Model Override</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(byProvider).map(([provider, models]) => (
            <div key={provider}>
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground py-1.5">
                {provider}
              </DropdownMenuLabel>
              {models.map(m => (
                <DropdownMenuItem
                  key={m.id}
                  onClick={() => onModelChange(m.id)}
                  className={cn(selectedModel === m.id && 'bg-accent')}
                >
                  <div className="flex flex-col gap-0.5 flex-1">
                    <span className="font-medium text-sm">{m.name}</span>
                    <span className="text-xs text-muted-foreground">{m.description}</span>
                  </div>
                  {selectedModel === m.id && <Check className="w-4 h-4 ml-2" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
