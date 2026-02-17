-- Chat sessions and messages for user-aware chat memory (Phase 2).
-- Sessions belong to auth.users; messages belong to a session.
-- RLS restricts all access to the owning user.

create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.chat_sessions is 'One per conversation; used for persistence and loading last N messages.';
comment on column public.chat_sessions.user_id is 'Owner; must equal auth.uid() for RLS.';
comment on column public.chat_sessions.title is 'Optional human-readable title for the conversation.';

create index chat_sessions_user_id_created_at_idx on public.chat_sessions (user_id, created_at desc);

alter table public.chat_sessions enable row level security;

create policy "chat_sessions_select_own"
  on public.chat_sessions for select to authenticated
  using (user_id = auth.uid());

create policy "chat_sessions_insert_own"
  on public.chat_sessions for insert to authenticated
  with check (user_id = auth.uid());

create policy "chat_sessions_update_own"
  on public.chat_sessions for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "chat_sessions_delete_own"
  on public.chat_sessions for delete to authenticated
  using (user_id = auth.uid());

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

comment on table public.chat_messages is 'Messages in a chat session; used to inject recent context into system prompt.';
comment on column public.chat_messages.role is 'Message role for LLM context.';

create index chat_messages_session_id_created_at_idx on public.chat_messages (session_id, created_at);

alter table public.chat_messages enable row level security;

create policy "chat_messages_select_own_session"
  on public.chat_messages for select to authenticated
  using (
    session_id in (select id from public.chat_sessions where user_id = auth.uid())
  );

create policy "chat_messages_insert_own_session"
  on public.chat_messages for insert to authenticated
  with check (
    session_id in (select id from public.chat_sessions where user_id = auth.uid())
  );

create policy "chat_messages_update_own_session"
  on public.chat_messages for update to authenticated
  using (
    session_id in (select id from public.chat_sessions where user_id = auth.uid())
  )
  with check (
    session_id in (select id from public.chat_sessions where user_id = auth.uid())
  );

create policy "chat_messages_delete_own_session"
  on public.chat_messages for delete to authenticated
  using (
    session_id in (select id from public.chat_sessions where user_id = auth.uid())
  );
