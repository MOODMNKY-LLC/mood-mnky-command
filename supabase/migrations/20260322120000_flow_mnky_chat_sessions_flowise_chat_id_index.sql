-- flow-mnky: index for chat_sessions.flowise_chat_id to support lookups by Flowise chat id.
-- Use supabase-local MCP to verify schema and indexes when changing chat/Flowise tables.

create index if not exists chat_sessions_flowise_chat_id_idx
  on public.chat_sessions (flowise_chat_id)
  where flowise_chat_id is not null;

comment on index public.chat_sessions_flowise_chat_id_idx is 'Supports lookups by Flowise chat id for flow-mnky.';
