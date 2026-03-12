-- Flowise Dojo chat audit log: truncated prompt/response and metadata for analytics and debugging.
-- Purpose: Audit trail for Flowise predict requests (optional); supports compliance and improvement.
-- Affected: new table flowise_chat_logs.

-- ========== 1. flowise_chat_logs ==========
create table if not exists public.flowise_chat_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  session_id text,
  chatflow_id text not null,
  prompt_preview text,
  response_preview text,
  tool_calls_count integer,
  latency_ms integer,
  created_at timestamptz not null default now()
);

comment on table public.flowise_chat_logs is 'Audit log for Flowise predict requests; truncated prompt/response for analytics and debugging.';
comment on column public.flowise_chat_logs.prompt_preview is 'Truncated user prompt (e.g. first 500 chars).';
comment on column public.flowise_chat_logs.response_preview is 'Truncated assistant response or [streamed] for streaming.';
comment on column public.flowise_chat_logs.latency_ms is 'Time from request start to response (or first byte for streaming).';

create index if not exists flowise_chat_logs_profile_id_idx
  on public.flowise_chat_logs (profile_id);
create index if not exists flowise_chat_logs_created_at_idx
  on public.flowise_chat_logs (created_at desc);
create index if not exists flowise_chat_logs_chatflow_id_idx
  on public.flowise_chat_logs (chatflow_id);

alter table public.flowise_chat_logs enable row level security;

-- RLS: users can insert their own and select their own; admins can select all.
drop policy if exists "flowise_chat_logs_select_own" on public.flowise_chat_logs;
create policy "flowise_chat_logs_select_own"
  on public.flowise_chat_logs for select to authenticated
  using (profile_id = auth.uid());

drop policy if exists "flowise_chat_logs_insert_own" on public.flowise_chat_logs;
create policy "flowise_chat_logs_insert_own"
  on public.flowise_chat_logs for insert to authenticated
  with check (profile_id = auth.uid());

-- Admin can select all (for analytics dashboard).
drop policy if exists "flowise_chat_logs_select_admin" on public.flowise_chat_logs;
create policy "flowise_chat_logs_select_admin"
  on public.flowise_chat_logs for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- No update/delete: append-only audit log.
