'use client'

import { useUserRole } from '@/hooks/use-user-role'
import { Loader2, ShieldOff } from 'lucide-react'

interface AdminGuardProps {
  children: React.ReactNode
  /** Fallback UI when the user is not an admin. Defaults to a "not authorised" message. */
  fallback?: React.ReactNode
}

/**
 * Wraps content that should only be visible to admin users.
 * The first authenticated user in the system is automatically
 * granted the 'admin' role; subsequent users get 'user'.
 */
export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { isAdmin, isLoading } = useUserRole()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAdmin) {
    return fallback ?? (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
        <ShieldOff className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          You do not have permission to access this area.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
