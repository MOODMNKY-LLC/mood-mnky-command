'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

export const useCurrentUserImage = () => {
  const [image, setImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserImage = async () => {
      const supabase = createClient()
      if (!supabase) {
        setImage(null)
        return
      }

      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error(error)
      }

      setImage(data.session?.user.user_metadata.avatar_url ?? null)
    }
    fetchUserImage()
  }, [])

  return image
}
