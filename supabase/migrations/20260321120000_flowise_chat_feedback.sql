-- Flowise Dojo chat feedback: thumbs up/down and optional comment for assistant replies.
-- Purpose: Store user ratings for Flowise chat responses for analytics and improvement.
-- Affected: new table flowise_chat_feedback.

-- ========== 1. flowise_chat_feedback ==========
create table if not exists public.flowise_chat_feedback (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  session_id text not null,
  message_id text,
  chatflow_id text,
  rating text not null check (rating in ('positive', 'negative')),
  comment text,
  created_at timestamptz not null default now()
);

comment on table public.flowise_chat_feedback is 'User feedback (thumbs up/down) for Flowise Dojo chat replies; one row per submission.';
comment on column public.flowise_chat_feedback.session_id is 'Flowise session id (from overrideConfig) for the conversation.';
comment on column public.flowise_chat_feedback.message_id is 'Flowise chatMessageId from metadata when available.';
comment on column public.flowise_chat_feedback.rating is 'positive or negative.';
comment on column public.flowise_chat_feedback.comment is 'Optional free-text comment from the user.';

create index if not exists flowise_chat_feedback_profile_id_idx
  on public.flowise_chat_feedback (profile_id);
create index if not exists flowise_chat_feedback_session_id_idx
  on public.flowise_chat_feedback (session_id);
create index if not exists flowise_chat_feedback_created_at_idx
  on public.flowise_chat_feedback (created_at desc);

alter table public.flowise_chat_feedback enable row level security;

-- RLS: authenticated users can insert their own feedback only; select own for display if needed.
drop policy if exists "flowise_chat_feedback_select_own" on public.flowise_chat_feedback;
create policy "flowise_chat_feedback_select_own"
  on public.flowise_chat_feedback for select to authenticated
  using (profile_id = auth.uid());

drop policy if exists "flowise_chat_feedback_insert_own" on public.flowise_chat_feedback;
create policy "flowise_chat_feedback_insert_own"
  on public.flowise_chat_feedback for insert to authenticated
  with check (profile_id = auth.uid());

-- No update/delete: feedback is append-only.
-- anon: no access
-- authenticated: select/insert own only (above).
