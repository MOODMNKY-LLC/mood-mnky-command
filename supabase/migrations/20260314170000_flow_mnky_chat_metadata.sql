-- Extend shared chat tables with the metadata required by flow-mnky.
-- This keeps flow-mnky aligned with the existing chat_sessions/chat_messages tables
-- instead of introducing a separate chats table with overlapping purpose.

alter table if exists public.chat_sessions
  add column if not exists chatflow_id text,
  add column if not exists chatflow_name text,
  add column if not exists flowise_chat_id text,
  add column if not exists pinned boolean not null default false,
  add column if not exists archived boolean not null default false,
  add column if not exists message_count integer not null default 0,
  add column if not exists last_message_at timestamptz;

create index if not exists chat_sessions_pinned_updated_at_idx
  on public.chat_sessions (pinned desc, updated_at desc);

alter table if exists public.chat_messages
  add column if not exists source_documents jsonb,
  add column if not exists used_tools jsonb;
