/**
 * Anon (browser/server user) Supabase config presence.
 * Does not check service-role; never invents credentials.
 */
export function hasSupabaseAnonConfig(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  return Boolean(url && key)
}
