import { createClient } from '@/lib/supabase/server'
import { getSupabaseConfigMissing } from '@/lib/supabase/admin'

export type RequireUserResult =
  | { ok: true; userId: string }
  | { ok: false; status: 401; error: string }
  | { ok: false; status: 503; error: string }

export async function requireUser(): Promise<RequireUserResult> {
  const missing = getSupabaseConfigMissing()
  if (missing) {
    return { ok: false, status: 503, error: `Supabase not configured. Set ${missing}.` }
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { ok: false, status: 401, error: 'Unauthorized' }
    }

    return { ok: true, userId: user.id }
  } catch (err) {
    console.error('[requireUser]', err)
    return { ok: false, status: 503, error: 'Server error.' }
  }
}
