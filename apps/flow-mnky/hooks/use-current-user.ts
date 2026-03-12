import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

export interface CurrentUser {
  name: string | null
  email: string | null
  avatarUrl: string | null
}

export function useCurrentUser(): CurrentUser {
  const [user, setUser] = useState<CurrentUser>({
    name: null,
    email: null,
    avatarUrl: null,
  })

  useEffect(() => {
    const supabase = createClient()

    const updateFromSession = () => {
      supabase.auth.getSession().then(({ data }) => {
        const u = data.session?.user
        setUser({
          name: u?.user_metadata?.full_name ?? null,
          email: u?.email ?? null,
          avatarUrl: u?.user_metadata?.avatar_url ?? null,
        })
      })
    }

    updateFromSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      updateFromSession()
    })
    return () => subscription.unsubscribe()
  }, [])

  return user
}
