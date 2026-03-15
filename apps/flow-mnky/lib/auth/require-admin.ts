import { createClient } from '@/lib/supabase/server'
import { createAdminClient, getSupabaseConfigMissing } from '@/lib/supabase/admin'
import { isAdminLikeRole } from '@/lib/auth/roles'

export type RequireAdminResult =
  | { ok: true; userId: string }
  | { ok: false; status: 401; error: string }
  | { ok: false; status: 403; error: string }
  | { ok: false; status: 503; error: string }

/**
 * Server-side guard: ensures the current user is an admin.
 * Use at the start of server actions or API handlers that must be admin-only.
 * Returns userId when ok so callers can use it for audit or ownership.
 */
export async function requireAdmin(): Promise<RequireAdminResult> {
  const missing = getSupabaseConfigMissing()
  if (missing) {
    return { ok: false, status: 503, error: `Supabase not configured. Set ${missing}.` }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  try {
    const admin = createAdminClient()
    const { data: profile, error } = await admin
      .from('profiles')
      .select('role, is_admin')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('[requireAdmin] profiles fetch error:', error)
      return { ok: false, status: 503, error: 'Failed to resolve role.' }
    }

    const isAdmin = isAdminLikeRole(profile?.role, profile?.is_admin)
    if (!isAdmin) {
      return { ok: false, status: 403, error: 'Admin only.' }
    }

    return { ok: true, userId: user.id }
  } catch (err) {
    console.error('[requireAdmin]', err)
    return { ok: false, status: 503, error: 'Server error.' }
  }
}
