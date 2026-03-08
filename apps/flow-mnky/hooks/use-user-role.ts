'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type AppRole = 'admin' | 'user' | 'pending'

/** DB role from profiles.role; we map moderator -> user for app role. */
type ProfileRole = 'admin' | 'moderator' | 'user' | 'pending'

interface UseUserRoleResult {
  role: AppRole
  isAdmin: boolean
  isLoading: boolean
  userId: string | null
}

function profileRoleToAppRole(r: ProfileRole | null | undefined): AppRole {
  if (r === 'admin') return 'admin'
  if (r === 'pending') return 'pending'
  return 'user' // moderator and user both map to 'user'
}

/**
 * Resolves user role from the profiles table (RLS: users can read own row).
 * First user is set to admin by handle_new_user; subsequent users get pending (or user).
 */
export function useUserRole(): UseUserRoleResult {
  const [role, setRole] = useState<AppRole>('pending')
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    if (!supabase) {
      setIsLoading(false)
      return
    }

    const resolveRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setRole('pending')
          setUserId(null)
          setIsLoading(false)
          return
        }

        setUserId(user.id)

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const profileRole = profile?.role as ProfileRole | undefined
        setRole(profileRoleToAppRole(profileRole ?? null))
      } catch {
        setRole('user')
      } finally {
        setIsLoading(false)
      }
    }

    resolveRole()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      resolveRole()
    })

    return () => subscription.unsubscribe()
  }, [])

  return { role, isAdmin: role === 'admin', isLoading, userId }
}
