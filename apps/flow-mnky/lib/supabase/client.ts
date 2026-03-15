'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | null | undefined

function readClientEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  return { url, key }
}

export function createOptionalClient(): SupabaseClient | null {
  if (browserClient !== undefined) {
    return browserClient
  }

  const { url, key } = readClientEnv()

  if (!url || !key) {
    browserClient = null
    return null
  }

  browserClient = createBrowserClient(url, key)
  return browserClient
}

export function createClient(): SupabaseClient {
  const client = createOptionalClient()
  if (!client) {
    throw new Error('Supabase browser client is not configured.')
  }
  return client
}
