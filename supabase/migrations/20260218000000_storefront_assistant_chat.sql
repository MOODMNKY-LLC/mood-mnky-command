-- Storefront chat sessions and messages for anonymous (unauthenticated) visitors.
-- Used by the MNKY Assistant embed on the Shopify Liquid theme.
-- Sessions are keyed by anonymous_id (cookie/Ephemeral ID from client).
-- RLS: only service role can access; anon has no direct access (API uses service role).

create table public.storefront_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);

comment on table public.storefront_chat_sessions is 'Anonymous chat sessions for storefront assistant; keyed by anonymous_id (cookie).';
comment on column public.storefront_chat_sessions.anonymous_id is 'Ephemeral ID from client (e.g. cookie); enables continuity without auth.';
comment on column public.storefront_chat_sessions.metadata is 'Optional metadata (e.g. UTM params, referrer).';

create index storefront_chat_sessions_anonymous_id_idx on public.storefront_chat_sessions (anonymous_id);
create index storefront_chat_sessions_created_at_idx on public.storefront_chat_sessions (created_at desc);

alter table public.storefront_chat_sessions enable row level security;

-- No anon/authenticated policies: API uses service role. This keeps data private.

create table public.storefront_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.storefront_chat_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

comment on table public.storefront_chat_messages is 'Messages for storefront assistant chat sessions.';
comment on column public.storefront_chat_messages.role is 'Message role for LLM context.';

create index storefront_chat_messages_session_id_created_at_idx on public.storefront_chat_messages (session_id, created_at);

alter table public.storefront_chat_messages enable row level security;

-- No anon/authenticated policies: API uses service role.
