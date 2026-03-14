import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/require-user'

export async function GET(req: Request) {
  const auth = await requireUser()
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }

  const { searchParams } = new URL(req.url)
  const includeArchived = searchParams.get('archived') === 'true'

  try {
    const supabase = await createClient()
    let query = supabase
      .from('chat_sessions')
      .select('id, title, chatflow_id, chatflow_name, flowise_chat_id, pinned, archived, message_count, created_at, updated_at')
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false })

    if (!includeArchived) {
      query = query.eq('archived', false)
    }

    const { data, error } = await query
    if (error) throw error

    return Response.json({ sessions: data ?? [] })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}

export async function POST(req: Request) {
  const auth = await requireUser()
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = (await req.json()) as {
      title?: string
      chatflowId?: string
      chatflowName?: string
      flowiseChatId?: string | null
      tempChat?: boolean
    }

    const supabase = await createClient()
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: auth.userId,
        title: body.title?.trim() || 'New Chat',
        chatflow_id: body.chatflowId?.trim() || null,
        chatflow_name: body.chatflowName?.trim() || null,
        flowise_chat_id: body.flowiseChatId?.trim() || null,
        archived: false,
        pinned: false,
        message_count: 0,
        updated_at: now,
      })
      .select('id, title, chatflow_id, chatflow_name, flowise_chat_id, pinned, archived, message_count, created_at, updated_at')
      .single()

    if (error) throw error

    return Response.json({ session: data }, { status: 201 })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}
