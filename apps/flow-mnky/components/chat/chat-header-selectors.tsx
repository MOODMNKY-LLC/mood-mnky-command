// Chat header: chatflow selector + configured model (read-only) + agent mode / tools status
'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ChevronDown, Bot, Check, Code, MessageSquare, Sparkles } from 'lucide-react'
import type { AgentModeId } from '@/lib/types'
import type { FlowiseChatflow } from './chat-shell'

const AGENT_MODES = [
  { id: 'default' as const, label: 'Default', description: 'Standard agent mode', icon: MessageSquare },
  { id: 'coder' as const, label: 'Coder', description: 'Code help with Context7 docs', icon: Code },
]

interface ChatHeaderSelectorsProps {
  chatflows: FlowiseChatflow[]
  selectedChatflowId: string
  flowType?: 'CHATFLOW' | 'MULTIAGENT' | null
  isLoading?: boolean
  onChatflowChange: (id: string) => void
  /** Read-only display; model is configured in Flowise or admin. */
  configuredModelName?: string | null
  selectedMode: AgentModeId
  onModeChange: (id: AgentModeId) => void
  /** Number of tools currently enabled/activated for this flow (for status indicator). */
  enabledToolsCount?: number
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
  flowType = null,
  isLoading = false,
  onChatflowChange,
  configuredModelName = null,
  selectedMode,
  onModeChange,
  enabledToolsCount = 0,
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
  const currentMode = AGENT_MODES.find(m => m.id === selectedMode) ?? AGENT_MODES[0]
  const currentChatflow = chatflows.find(c => c.id === selectedChatflowId)
  const ModeIcon = currentMode.icon

  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* Chatflow selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={isLoading}
            className="h-8 gap-1.5 px-2.5 rounded-lg border border-border/30 bg-transparent hover:bg-accent/50 text-sm font-medium max-w-48 min-w-0"
          >
            <Bot className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {isLoading ? 'Loading chatflows...' : currentChatflow?.name ?? 'Select chatflow'}
            </span>
            {flowType === 'MULTIAGENT' && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium shrink-0">
                Agent
              </Badge>
            )}
            <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Flowise Chatflows</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isLoading ? (
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              Loading chatflows...
            </DropdownMenuItem>
          ) : chatflows.length === 0 ? (
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

      {/* Configured model (read-only; change in Flowise or admin) */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border/30 bg-muted/30 text-sm text-muted-foreground max-w-40 min-w-0">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{configuredModelName || (isLoading ? '…' : '—')}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p>Model is set in Flowise or the admin panel. It cannot be changed from the chat.</p>
        </TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-4" />

      {/* Agent mode + tools activated status */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-8 gap-1.5 px-2.5 rounded-lg border border-border/30 bg-transparent hover:bg-accent/50 text-sm font-medium"
          >
            <ModeIcon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate max-w-24 sm:max-w-none">{currentMode.label}</span>
            {enabledToolsCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium shrink-0">
                {enabledToolsCount} tool{enabledToolsCount !== 1 ? 's' : ''} on
              </Badge>
            )}
            <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Agent mode</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {AGENT_MODES.map(mode => {
            const Icon = mode.icon
            return (
              <DropdownMenuItem
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                className={cn(selectedMode === mode.id && 'bg-accent')}
              >
                <Icon className="w-4 h-4 shrink-0 mr-2 text-muted-foreground" />
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="font-medium text-sm">{mode.label}</span>
                  <span className="text-xs text-muted-foreground">{mode.description}</span>
                </div>
                {selectedMode === mode.id && <Check className="w-4 h-4 ml-2 shrink-0" />}
              </DropdownMenuItem>
            )
          })}
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5 text-[11px] text-muted-foreground">
            {enabledToolsCount} tool{enabledToolsCount !== 1 ? 's' : ''} on · Use the wrench in the message bar to change
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
