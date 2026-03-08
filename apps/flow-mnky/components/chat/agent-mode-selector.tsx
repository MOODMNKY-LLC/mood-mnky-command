'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MessageSquare, Code2, PenLine, BarChart3, Search } from 'lucide-react'
import { AGENT_MODES } from '@/lib/types'
import type { AgentModeId } from '@/lib/types'

interface AgentModeSelectorProps {
  selectedMode: AgentModeId | string
  onModeChange: (mode: string) => void
}

const ICON_MAP: Record<string, React.ReactNode> = {
  MessageSquare: <MessageSquare className="w-4 h-4" />,
  Code2:         <Code2 className="w-4 h-4" />,
  PenLine:       <PenLine className="w-4 h-4" />,
  BarChart3:     <BarChart3 className="w-4 h-4" />,
  Search:        <Search className="w-4 h-4" />,
}

export function AgentModeSelector({ selectedMode, onModeChange }: AgentModeSelectorProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 p-1 glass rounded-xl border border-border/50">
        {AGENT_MODES.map((mode) => (
          <Tooltip key={mode.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onModeChange(mode.id)}
                className={cn(
                  'h-8 w-8 p-0 rounded-lg transition-all duration-200',
                  selectedMode === mode.id
                    ? 'bg-foreground text-background hover:bg-foreground/90'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                {ICON_MAP[mode.icon]}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="glass-strong border-border/50">
              <div className="text-sm font-medium">{mode.name}</div>
              <div className="text-xs text-muted-foreground">{mode.description}</div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
