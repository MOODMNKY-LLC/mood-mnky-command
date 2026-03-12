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
          role: 'user' | 'workspace_admin' | 'tenant_admin' | 'platform_admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          emoji: string | null
          color: string | null
          chatflow_id: string | null
          pinned: boolean
          archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          emoji?: string | null
          color?: string | null
          chatflow_id?: string | null
          pinned?: boolean
          archived?: boolean
        }
        Update: Partial<Omit<Database['public']['Tables']['projects']['Insert'], 'user_id'>>
      }
      chats: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          title: string
          chatflow_id: string | null
          chatflow_name: string | null
          flowise_chat_id: string | null
          pinned: boolean
          archived: boolean
          shared: boolean
          message_count: number
          last_message_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          title?: string
          chatflow_id?: string | null
          chatflow_name?: string | null
          flowise_chat_id?: string | null
          pinned?: boolean
          archived?: boolean
          shared?: boolean
          message_count?: number
          last_message_at?: string | null
        }
        Update: Partial<Omit<Database['public']['Tables']['chats']['Insert'], 'user_id'>>
      }
      chat_messages: {
        Row: {
          id: string
          chat_id: string
          user_id: string
          role: 'user' | 'assistant'
          content: string
          source_documents: Json | null
          used_tools: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          user_id: string
          role: 'user' | 'assistant'
          content: string
          source_documents?: Json | null
          used_tools?: Json | null
        }
        Update: never
      }
      user_images: {
        Row: {
          id: string
          user_id: string
          chat_id: string | null
          project_id: string | null
          storage_path: string
          file_name: string
          mime_type: string
          size_bytes: number | null
          width: number | null
          height: number | null
          caption: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          chat_id?: string | null
          project_id?: string | null
          storage_path: string
          file_name: string
          mime_type?: string
          size_bytes?: number | null
          width?: number | null
          height?: number | null
          caption?: string | null
        }
        Update: Partial<Omit<Database['public']['Tables']['user_images']['Insert'], 'user_id'>>
      }
    }
  }
}

export type Profile   = Database['public']['Tables']['profiles']['Row']
export type Project   = Database['public']['Tables']['projects']['Row']
export type Chat      = Database['public']['Tables']['chats']['Row']
export type ChatMsg   = Database['public']['Tables']['chat_messages']['Row']
export type UserImage = Database['public']['Tables']['user_images']['Row']
