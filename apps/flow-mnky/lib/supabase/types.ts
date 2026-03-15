/**
 * Supabase database types for flow-mnky.
 * Aligned with supabase/migrations: chat_sessions, chat_messages (session_id),
 * profiles (default_chatflow_id, allowed_openai_models, is_admin),
 * flowise_user_document_stores.
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          avatar_url: string | null
          role: string
          is_admin: boolean | null
          default_chatflow_id: string | null
          allowed_openai_models: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          role?: string
          is_admin?: boolean | null
          default_chatflow_id?: string | null
          allowed_openai_models?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          title: string | null
          chatflow_id: string | null
          chatflow_name: string | null
          flowise_chat_id: string | null
          pinned: boolean
          archived: boolean
          message_count: number
          last_message_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          chatflow_id?: string | null
          chatflow_name?: string | null
          flowise_chat_id?: string | null
          pinned?: boolean
          archived?: boolean
          message_count?: number
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Database['public']['Tables']['chat_sessions']['Insert'], 'user_id'>>
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: string
          content: string
          source_documents: Json | null
          used_tools: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: string
          content: string
          source_documents?: Json | null
          used_tools?: Json | null
          created_at?: string
        }
        Update: never
      }
      flowise_user_document_stores: {
        Row: {
          id: string
          profile_id: string
          flowise_store_id: string
          display_name: string | null
          scope: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          flowise_store_id: string
          display_name?: string | null
          scope?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Database['public']['Tables']['flowise_user_document_stores']['Insert'], 'profile_id'>>
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ChatSessionRow = Database['public']['Tables']['chat_sessions']['Row']
export type ChatMessageRow = Database['public']['Tables']['chat_messages']['Row']
export type FlowiseUserDocumentStoreRow = Database['public']['Tables']['flowise_user_document_stores']['Row']
