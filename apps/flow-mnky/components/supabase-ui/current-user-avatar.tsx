'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useCurrentUserImage } from '@/hooks/use-current-user-image'
import { useCurrentUserName } from '@/hooks/use-current-user-name'

export const CurrentUserAvatar = ({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const image = useCurrentUserImage()
  const name = useCurrentUserName()

  const initials = name
    ?.split(' ')
    ?.map(w => w[0])
    ?.join('')
    ?.toUpperCase()
    ?.slice(0, 2) ?? '?'

  const sizeClass = size === 'lg' ? 'w-9 h-9' : size === 'md' ? 'w-7 h-7' : 'w-6 h-6'
  const textClass = size === 'lg' ? 'text-sm' : 'text-xs'

  return (
    <Avatar className={sizeClass}>
      {image && <AvatarImage src={image} alt={name ?? 'User'} />}
      <AvatarFallback className={textClass}>{initials}</AvatarFallback>
    </Avatar>
  )
}
