import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/require-user'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser()
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params

  try {
    const supabase = await createClient()
    const { data: chat, error: chatError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', id)
      .eq('user_id', auth.userId)
      .single()

    if (chatError || !chat) {
      return Response.json({ error: 'Chat session not found.' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, role, content, source_documents, used_tools, created_at')
      .eq('session_id', id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return Response.json({ messages: data ?? [] })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser()
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params

  try {
    const body = (await req.json()) as {
      messages: Array<{
        role: 'user' | 'assistant'
        content: string
        sourceDocuments?: unknown[] | null
        usedTools?: unknown[] | null
      }>
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json({ error: 'At least one message is required.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: chat, error: chatError } = await supabase
      .from('chat_sessions')
      .select('id, message_count')
      .eq('id', id)
      .eq('user_id', auth.userId)
      .single()

    if (chatError || !chat) {
      return Response.json({ error: 'Chat session not found.' }, { status: 404 })
    }

    const sanitizedMessages = body.messages
      .filter((message) => typeof message.content === 'string' && message.content.trim().length > 0)
      .map((message) => ({
        session_id: id,
        role: message.role,
        content: message.content.trim(),
        source_documents: message.sourceDocuments ?? null,
        used_tools: message.usedTools ?? null,
      }))

    if (sanitizedMessages.length === 0) {
      return Response.json({ error: 'No valid messages to save.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert(sanitizedMessages)
      .select('id, role, content, source_documents, used_tools, created_at')

    if (error) throw error

    const { error: updateError } = await supabase
      .from('chat_sessions')
      .update({
        message_count: (chat.message_count ?? 0) + sanitizedMessages.length,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', auth.userId)

    if (updateError) throw updateError

    return Response.json({ messages: data ?? [] }, { status: 201 })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}
