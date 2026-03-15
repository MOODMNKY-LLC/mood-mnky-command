import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/chat/document-stores/assignments
 * Returns the current user's Flowise document store assignments (from flowise_user_document_stores).
 * Used to show "my store" in dojo scope and for RAG store selection.
 */
export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('flowise_user_document_stores')
      .select('id, flowise_store_id, display_name, scope, created_at')
      .eq('profile_id', auth.userId)
      .order('scope')

    if (error) throw error
    return Response.json({ assignments: data ?? [] })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to load assignments' },
      { status: 502 }
    )
  }
}
