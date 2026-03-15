import { requireUser } from '@/lib/auth/require-user'
import { listChatflows } from '@/lib/flowise/client'
import { getCurrentUserProfile } from '@/lib/chat/session-store'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const [profile, chatflows] = await Promise.all([
      getCurrentUserProfile(auth.userId),
      listChatflows(),
    ])

    let assignedIds: Set<string> | null = null
    if (profile.role !== 'admin') {
      const supabase = await createClient()
      const { data } = await supabase
        .from('flowise_chatflow_assignments')
        .select('chatflow_id')
        .eq('profile_id', auth.userId)
      assignedIds = new Set((data ?? []).map((a) => a.chatflow_id))
    }
    const visibleChatflows =
      profile.role === 'admin'
        ? chatflows
        : chatflows.filter(
            (chatflow) =>
              (chatflow.deployed ?? chatflow.isPublic ?? false) &&
              (assignedIds === null || assignedIds.has(chatflow.id))
          )

    const defaultChatflowId = visibleChatflows.some((chatflow) => chatflow.id === profile.defaultChatflowId)
      ? profile.defaultChatflowId
      : visibleChatflows[0]?.id ?? null

    return Response.json({
      chatflows: visibleChatflows.map((chatflow) => ({
        id: chatflow.id,
        name: chatflow.name,
        description: chatflow.description,
        deployed: chatflow.deployed ?? false,
      })),
      defaultChatflowId,
      allowedOpenAIModels: profile.allowedOpenAIModels,
      role: profile.role,
    })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}
