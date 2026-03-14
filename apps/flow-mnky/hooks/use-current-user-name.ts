'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

export const useCurrentUserName = () => {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfileName = async () => {
      const supabase = createClient()
      if (!supabase) {
        setName('?')
        return
      }

      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error(error)
      }

      setName(data.session?.user.user_metadata.full_name ?? '?')
    }

    fetchProfileName()
  }, [])

  return name || '?'
}
