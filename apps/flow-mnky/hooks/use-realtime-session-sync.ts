'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createOptionalClient } from '@/lib/supabase/client'

const CHANNEL_SESSIONS_PREFIX = 'user:'
const CHANNEL_SESSIONS_SUFFIX = ':sessions'
const EVENT_SESSIONS_UPDATED = 'sessions_updated'
const EVENT_MESSAGE_ADDED = 'message_added'

export interface UseRealtimeSessionSyncOptions {
  userId: string | null
  onSessionsUpdated: () => void
  onMessageAdded: (sessionId: string) => void
}

/**
 * Subscribes to Realtime channel for session list and message updates so multiple tabs stay in sync.
 * Call broadcastSessionsUpdated() after create/patch/delete session; call broadcastMessageAdded(sessionId) after persisting messages.
 */
export function useRealtimeSessionSync({
  userId,
  onSessionsUpdated,
  onMessageAdded,
}: UseRealtimeSessionSyncOptions) {
  const channelRef = useRef<ReturnType<ReturnType<typeof createOptionalClient>['channel']> | null>(null)
  const onSessionsRef = useRef(onSessionsUpdated)
  const onMessageRef = useRef(onMessageAdded)
  onSessionsRef.current = onSessionsUpdated
  onMessageRef.current = onMessageAdded

  useEffect(() => {
    const supabase = createOptionalClient()
    if (!supabase || !userId) {
      channelRef.current = null
      return
    }

    const channelName = `${CHANNEL_SESSIONS_PREFIX}${userId}${CHANNEL_SESSIONS_SUFFIX}`
    const channel = supabase.channel(channelName)
    channelRef.current = channel

    channel
      .on('broadcast', { event: EVENT_SESSIONS_UPDATED }, () => {
        onSessionsRef.current()
      })
      .on('broadcast', { event: EVENT_MESSAGE_ADDED }, ({ payload }: { payload?: { sessionId?: string } }) => {
        const sessionId = payload?.sessionId
        if (typeof sessionId === 'string') onMessageRef.current(sessionId)
      })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') channelRef.current = null
      })

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [userId])

  const broadcastSessionsUpdated = useCallback(() => {
    const ch = channelRef.current
    if (!ch) return
    ch.send({ type: 'broadcast', event: EVENT_SESSIONS_UPDATED, payload: {} })
  }, [])

  const broadcastMessageAdded = useCallback((sessionId: string) => {
    const ch = channelRef.current
    if (!ch) return
    ch.send({ type: 'broadcast', event: EVENT_MESSAGE_ADDED, payload: { sessionId } })
  }, [])

  return { broadcastSessionsUpdated, broadcastMessageAdded }
}
