-- Migration: eleven_labs_config table
-- Purpose: Store ElevenLabs agent/config for Verse voice chat and conversation UI.
-- Used by: GET/PATCH /api/chat/eleven-labs-config
-- Affected: new table eleven_labs_config

create table if not exists public.eleven_labs_config (
  id text primary key default 'default',
  agent_id text,
  api_key_override text,
  connection_type text not null default 'webrtc' check (connection_type in ('webrtc', 'websocket')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.eleven_labs_config is 'ElevenLabs voice config for Verse chat; agent_id exposed to clients, api_key_override admin-only.';

-- Seed default row so GET can return env fallback when no override set
insert into public.eleven_labs_config (id, agent_id, connection_type)
values ('default', null, 'webrtc')
on conflict (id) do nothing;

alter table public.eleven_labs_config enable row level security;

-- Anon/authenticated: read agent_id and connection_type only (for client config)
-- Do not expose api_key_override via RLS; API uses service role for full read
create policy "eleven_labs_config_select_agent_id"
  on public.eleven_labs_config for select
  to anon, authenticated
  using (true);

-- Admin only: full update (PATCH uses service role; this is defense in depth)
create policy "eleven_labs_config_update_admin"
  on public.eleven_labs_config for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
