'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { PresenceUser } from '@/hooks/use-realtime-presence-room'

interface AvatarStackProps {
  users: PresenceUser[]
  maxVisible?: number
}

export const AvatarStack = ({ users, maxVisible = 5 }: AvatarStackProps) => {
  const visible = users.slice(0, maxVisible)
  const overflow = users.length - maxVisible

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((user, i) => {
        const initials = user.name
          ?.split(' ')
          ?.map(w => w[0])
          ?.join('')
          ?.toUpperCase()
          ?.slice(0, 2) ?? '?'
        return (
          <Avatar
            key={i}
            title={user.name}
            className={cn('w-7 h-7 border-2 border-background ring-0')}
          >
            {user.image && <AvatarImage src={user.image} alt={user.name} />}
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
        )
      })}
      {overflow > 0 && (
        <div className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-medium">
          +{overflow}
        </div>
      )}
    </div>
  )
}
