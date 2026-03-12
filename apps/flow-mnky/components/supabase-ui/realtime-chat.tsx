'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'

export interface ChatMessage {
  id: string
  content: string
  user: { name: string }
  createdAt: string
}

interface RealtimeChatProps {
  roomName: string
  username: string
  messages?: ChatMessage[]
  onMessage?: (messages: ChatMessage[]) => void
  className?: string
}

function ChatMessageItem({
  message,
  isOwn,
  showHeader,
}: {
  message: ChatMessage
  isOwn: boolean
  showHeader: boolean
}) {
  return (
    <div className={cn('flex mt-2', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[75%] flex flex-col gap-0.5', isOwn && 'items-end')}>
        {showHeader && (
          <div className={cn('flex items-center gap-2 text-xs px-3', isOwn && 'flex-row-reverse')}>
            <span className="font-medium text-foreground/80">{message.user.name}</span>
            <span className="text-muted-foreground">
              {new Date(message.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          </div>
        )}
        <div
          className={cn(
            'py-2 px-3 rounded-xl text-sm w-fit',
            isOwn
              ? 'bg-foreground text-background'
              : 'bg-muted text-foreground'
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  )
}

/**
 * Realtime Chat — Supabase UI pattern
 * Uses Supabase Realtime Broadcast for low-latency group messaging.
 * Pass `onMessage` to persist messages to a database.
 */
export function RealtimeChat({
  roomName,
  username,
  messages: initialMessages = [],
  onMessage,
  className,
}: RealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`realtime-chat-${roomName}`)

    channel
      .on('broadcast', { event: 'message' }, ({ payload }: { payload: ChatMessage }) => {
        setMessages(prev => {
          const next = [...prev, payload]
          onMessage?.(next)
          return next
        })
      })
      .subscribe(status => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [roomName, onMessage])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(() => {
    if (!input.trim() || !channelRef.current || !isConnected) return

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      content: input.trim(),
      user: { name: username },
      createdAt: new Date().toISOString(),
    }

    channelRef.current.send({ type: 'broadcast', event: 'message', payload: msg })
    setMessages(prev => {
      const next = [...prev, msg]
      onMessage?.(next)
      return next
    })
    setInput('')
  }, [input, isConnected, username, onMessage])

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.user.name === username
            const showHeader = i === 0 || messages[i - 1].user.name !== msg.user.name
            return (
              <ChatMessageItem key={msg.id} message={msg} isOwn={isOwn} showHeader={showHeader} />
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border/40">
        <div className="flex-1 relative">
          <input
            className="w-full h-9 px-3 text-sm bg-muted/40 border border-border/50 rounded-lg outline-none focus:border-border/80 placeholder:text-muted-foreground/50 transition-colors"
            placeholder={isConnected ? 'Message the group…' : 'Connecting…'}
            value={input}
            disabled={!isConnected}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          />
        </div>
        <Button
          size="icon"
          className="h-9 w-9 shrink-0"
          disabled={!input.trim() || !isConnected}
          onClick={sendMessage}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
