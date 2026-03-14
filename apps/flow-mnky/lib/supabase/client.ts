'use client'

import { createBrowserClient, type SupabaseClient } from '@supabase/ssr'

export function createClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  // Return null if Supabase is not configured
  if (!url || !key) {
    return null
  }

  // Create the browser client lazily so Turbopack HMR does not hold onto stale module state.
  return createBrowserClient(url, key)
}
