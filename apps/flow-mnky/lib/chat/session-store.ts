import { createClient } from '@/lib/supabase/server'
import { normalizeProfileRole, isAdminLikeRole, type AppRole } from '@/lib/auth/roles'

export interface ChatSessionRow {
  id: string
  title: string
  chatflow_id: string | null
  chatflow_name: string | null
  flowise_chat_id: string | null
  pinned: boolean
  archived: boolean
  message_count: number
  created_at: string
  updated_at: string
}

export interface ChatMessageRow {
  id: string
  role: 'user' | 'assistant'
  content: string
  source_documents: unknown[] | null
  used_tools: unknown[] | null
  created_at: string
}

export interface CurrentProfile {
  role: AppRole
  defaultChatflowId: string | null
  allowedOpenAIModels: string[] | null
}

export async function getCurrentUserProfile(userId: string): Promise<CurrentProfile> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, default_chatflow_id, allowed_openai_models, is_admin')
      .eq('id', userId)
      .single()

    if (error) throw error

    return {
      role: normalizeProfileRole(data?.role),
      defaultChatflowId:
        typeof data?.default_chatflow_id === 'string' ? data.default_chatflow_id : null,
      allowedOpenAIModels: Array.isArray(data?.allowed_openai_models)
        ? (data.allowed_openai_models as string[])
        : null,
    }
  } catch {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, is_admin')
      .eq('id', userId)
      .single()

    if (error) {
      return {
        role: 'user',
        defaultChatflowId: null,
        allowedOpenAIModels: null,
      }
    }

    return {
      role: isAdminLikeRole(data?.role, data?.is_admin) ? 'admin' : normalizeProfileRole(data?.role),
      defaultChatflowId: null,
      allowedOpenAIModels: null,
    }
  }
}

