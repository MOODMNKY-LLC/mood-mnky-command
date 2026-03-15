'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ChatMessage {
  id: string
  content: string
  user: { name: string }
  createdAt: string
}

interface UseRealtimeChatOptions {
  roomName: string
  username?: string
}

export const useRealtimeChat = (optionsOrRoomName: string | UseRealtimeChatOptions) => {
  const roomName =
    typeof optionsOrRoomName === 'string' ? optionsOrRoomName : optionsOrRoomName.roomName
  const username =
    typeof optionsOrRoomName === 'string' ? undefined : optionsOrRoomName.username

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  const [isConnected, setIsConnected] = useState(false)

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
          .subscribe((status) => {
            setIsConnected(status === 'SUBSCRIBED')
          })
      } catch {
        // Supabase not configured — graceful no-op
      }
    }

    setup()
    return () => {
      setIsConnected(false)
      channel?.unsubscribe()
    }
  }, [roomName])

  const sendMessage = useCallback(async (content: string, usernameOverride?: string) => {
    if (!channelRef.current) return
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      user: { name: usernameOverride ?? username ?? 'User' },
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, msg])
    await channelRef.current.send({ type: 'broadcast', event: 'message', payload: msg })
  }, [username])

  return { messages, sendMessage, isConnected }
}
