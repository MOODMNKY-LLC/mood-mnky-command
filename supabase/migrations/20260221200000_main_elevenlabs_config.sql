-- Migration: main_elevenlabs_config table
-- Purpose: Main landing ElevenLabs config (agent, voice, brand audio sample, feature flags).
-- Used by: GET /api/main/elevenlabs-config (server-only), LABZ Main ElevenLabs config page.
-- All columns are public (no API keys); RLS allows anon read for server-side fetch.

create table if not exists public.main_elevenlabs_config (
  id text primary key default 'default',
  agent_id text,
  default_voice_id text,
  audio_sample_url text,
  show_voice_section boolean not null default true,
  show_audio_sample boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.main_elevenlabs_config is 'Main landing ElevenLabs: agent_id, default_voice_id, brand audio sample URL, feature flags. No secrets.';

insert into public.main_elevenlabs_config (id, agent_id)
values ('default', null)
on conflict (id) do nothing;

alter table public.main_elevenlabs_config enable row level security;

-- anon and authenticated may read (server uses anon or service role to fetch for Main page)
create policy "main_elevenlabs_config_select_anon"
  on public.main_elevenlabs_config for select
  to anon
  using (true);

create policy "main_elevenlabs_config_select_authenticated"
  on public.main_elevenlabs_config for select
  to authenticated
  using (true);

-- only admins may update (LABZ config page)
create policy "main_elevenlabs_config_update_admin"
  on public.main_elevenlabs_config for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- only admins may insert (defense in depth; typically only default row exists)
create policy "main_elevenlabs_config_insert_admin"
  on public.main_elevenlabs_config for insert
  to authenticated
  with check (public.is_admin());
