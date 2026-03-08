'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ChatMessage {
  id: string
  content: string
  user: { name: string }
  createdAt: string
}

export const useRealtimeChat = (roomName: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  useEffect(() => {
    let channel: typeof channelRef.current = null

    const setup = async () => {
      try {
        const supabase = createClient()
        channel = supabase.channel(`chat:${roomName}`)
        channelRef.current = channel

        channel
          .on('broadcast', { event: 'message' }, ({ payload }) => {
            setMessages(prev => [...prev, payload as ChatMessage])
          })
          .subscribe()
      } catch {
        // Supabase not configured — graceful no-op
      }
    }

    setup()
    return () => { channel?.unsubscribe() }
  }, [roomName])

  const sendMessage = useCallback(async (content: string, username: string) => {
    if (!channelRef.current) return
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      user: { name: username },
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, msg])
    await channelRef.current.send({ type: 'broadcast', event: 'message', payload: msg })
  }, [])

  return { messages, sendMessage }
}
