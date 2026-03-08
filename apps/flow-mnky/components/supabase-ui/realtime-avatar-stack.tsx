'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface PresenceUser {
  name: string
  color: string
  userId: string
}

interface AvatarStackProps {
  roomName: string
  currentUsername: string
  className?: string
  maxVisible?: number
}

function getColorForUser(userId: string): string {
  const palette = [
    'oklch(0.6 0.18 320)',
    'oklch(0.55 0.2 30)',
    'oklch(0.5 0.15 200)',
    'oklch(0.6 0.12 150)',
    'oklch(0.65 0.14 260)',
    'oklch(0.7 0.16 60)',
  ]
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return palette[Math.abs(hash) % palette.length]
}

/**
 * Realtime Avatar Stack — Supabase UI pattern
 * Shows stacked avatars of users currently online in a room using Supabase Realtime Presence.
 */
export function RealtimeAvatarStack({
  roomName,
  currentUsername,
  className,
  maxVisible = 4,
}: AvatarStackProps) {
  const [users, setUsers] = useState<PresenceUser[]>([])

  useEffect(() => {
    const supabase = createClient()
    const userId = `user-${Math.random().toString(36).slice(2, 8)}`

    const channel = supabase.channel(`avatar-stack-${roomName}`, {
      config: { presence: { key: userId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ name: string; userId: string }>()
        const online: PresenceUser[] = Object.values(state)
          .flat()
          .map(u => ({
            name: u.name,
            userId: u.userId,
            color: getColorForUser(u.userId),
          }))
        setUsers(online)
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ name: currentUsername, userId })
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [roomName, currentUsername])

  const visible = users.slice(0, maxVisible)
  const overflow = users.length - maxVisible

  if (users.length === 0) return null

  return (
    <div className={cn('flex items-center', className)}>
      {visible.map((user, i) => (
        <div
          key={user.userId}
          className="relative w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-background"
          style={{
            background: user.color,
            marginLeft: i > 0 ? '-8px' : 0,
            zIndex: visible.length - i,
          }}
          title={user.name}
        >
          {user.name.slice(0, 2).toUpperCase()}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="relative w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold bg-muted text-muted-foreground border-2 border-background"
          style={{ marginLeft: '-8px', zIndex: 0 }}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
