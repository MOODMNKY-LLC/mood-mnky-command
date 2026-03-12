import { createBrowserClient, type SupabaseClient } from '@supabase/ssr'

let cachedClient: SupabaseClient | null = null

export function createClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  // Return null if Supabase is not configured
  if (!url || !key) {
    return null
  }

  // Return cached client if available (prevents multiple instances)
  if (cachedClient) {
    return cachedClient
  }

  cachedClient = createBrowserClient(url, key)
  return cachedClient
}
