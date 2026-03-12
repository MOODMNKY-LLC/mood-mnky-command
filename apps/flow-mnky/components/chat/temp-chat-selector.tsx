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
import { Clock, ChevronDown, Check, Plus, Trash2 } from 'lucide-react'

interface TempSession {
  id: string
  name: string
  createdAt: Date
}

interface TempChatSelectorProps {
  sessions: TempSession[]
  currentSessionId: string
  onSelectSession: (id: string) => void
  onNewSession: () => void
  onDeleteSession: (id: string) => void
}

export function TempChatSelector({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}: TempChatSelectorProps) {
  const [open, setOpen] = useState(false)
  const currentSession = sessions.find(s => s.id === currentSessionId)

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

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
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium truncate max-w-24">
            {currentSession?.name || 'Session 1'}
          </span>
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
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Temporary Sessions</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs hover:bg-accent/50"
            onClick={(e) => {
              e.stopPropagation()
              onNewSession()
            }}
          >
            <Plus className="w-3 h-3 mr-1" />
            New
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />

        {sessions.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No temporary sessions
          </div>
        ) : (
          sessions.map((session) => (
            <DropdownMenuItem
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 cursor-pointer group',
                'hover:bg-accent/50 focus:bg-accent/50 transition-colors',
                currentSessionId === session.id && 'bg-accent/30'
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Clock className="w-4 h-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{session.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(session.createdAt)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {currentSessionId === session.id && (
                  <Check className="w-4 h-4 text-foreground" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteSession(session.id)
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator className="bg-border/50" />
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Temporary sessions are not saved and will be cleared when you leave.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
