import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/require-user'

async function getUserSession(id: string, userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return { supabase, found: false as const }
  }

  return { supabase, found: true as const }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser()
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const { supabase, found } = await getUserSession(id, auth.userId)
  if (!found) {
    return Response.json({ error: 'Chat session not found.' }, { status: 404 })
  }

  try {
    const body = (await req.json()) as {
      title?: string
      pinned?: boolean
      archived?: boolean
      flowiseChatId?: string | null
      messageCount?: number
      lastMessageAt?: string | null
      chatflowId?: string | null
      chatflowName?: string | null
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof body.title === 'string') updates.title = body.title.trim() || 'New Chat'
    if (typeof body.pinned === 'boolean') updates.pinned = body.pinned
    if (typeof body.archived === 'boolean') updates.archived = body.archived
    if ('flowiseChatId' in body) updates.flowise_chat_id = body.flowiseChatId?.trim() || null
    if (typeof body.messageCount === 'number') updates.message_count = body.messageCount
    if ('lastMessageAt' in body) updates.last_message_at = body.lastMessageAt
    if ('chatflowId' in body) updates.chatflow_id = body.chatflowId?.trim() || null
    if ('chatflowName' in body) updates.chatflow_name = body.chatflowName?.trim() || null

    const { data, error } = await supabase
      .from('chat_sessions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', auth.userId)
      .select('id, title, chatflow_id, chatflow_name, flowise_chat_id, pinned, archived, message_count, created_at, updated_at')
      .single()

    if (error) throw error

    return Response.json({ session: data })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser()
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const { supabase, found } = await getUserSession(id, auth.userId)
  if (!found) {
    return Response.json({ error: 'Chat session not found.' }, { status: 404 })
  }

  try {
    const { error } = await supabase.from('chat_sessions').delete().eq('id', id).eq('user_id', auth.userId)
    if (error) throw error
    return new Response(null, { status: 204 })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}
