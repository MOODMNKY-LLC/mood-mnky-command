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
import { ChevronDown, Sparkles, Zap, Brain, Check } from 'lucide-react'
import { AI_MODELS } from '@/lib/types'

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (model: string) => void
}

const providerIcons: Record<string, React.ReactNode> = {
  OpenAI: <Sparkles className="w-3 h-3" />,
  Anthropic: <Brain className="w-3 h-3" />,
  Google: <Zap className="w-3 h-3" />,
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const currentModel = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0]

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'h-9 gap-2 px-3 glass hover:bg-accent/50 border border-border/50',
            'transition-all duration-200'
          )}
        >
          <div className="flex items-center gap-2">
            {providerIcons[currentModel.provider]}
            <span className="font-medium">{currentModel.name}</span>
          </div>
          <ChevronDown className={cn(
            'w-4 h-4 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180'
          )} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64 glass-strong border-border/50 animate-fade-in"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Select Model
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />
        {AI_MODELS.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => onModelChange(model.id)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 cursor-pointer',
              'hover:bg-accent/50 focus:bg-accent/50 transition-colors',
              selectedModel === model.id && 'bg-accent/30'
            )}
          >
            <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
              {providerIcons[model.provider]}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{model.name}</div>
              <div className="text-xs text-muted-foreground">{model.description}</div>
            </div>
            {selectedModel === model.id && (
              <Check className="w-4 h-4 text-foreground" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
