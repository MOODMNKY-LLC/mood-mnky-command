-- Migration: flowise_tts_config and flowise_chatflow_tts
-- Purpose: App-wide default and per-chatflow read-aloud (TTS) voice for Dojo Flowise chat.
-- Used by: GET/PATCH /api/flowise/tts-config, PUT /api/flowise/chatflows/[id]/tts-voice
-- Affected: new tables flowise_tts_config, flowise_chatflow_tts

-- ========== 1. flowise_tts_config (app-wide default voice) ==========
create table if not exists public.flowise_tts_config (
  id text primary key default 'default',
  default_voice text not null default 'ballad',
  updated_at timestamptz not null default now()
);

comment on table public.flowise_tts_config is 'App-wide default TTS voice for read-aloud in Flowise Dojo chat.';
comment on column public.flowise_tts_config.default_voice is 'OpenAI voice id (e.g. ballad, alloy).';

insert into public.flowise_tts_config (id, default_voice)
values ('default', 'ballad')
on conflict (id) do nothing;

alter table public.flowise_tts_config enable row level security;

-- Authenticated: read default_voice (for Dojo and LABZ UI)
create policy "flowise_tts_config_select_authenticated"
  on public.flowise_tts_config for select
  to authenticated
  using (true);

-- Admin only: update app default
create policy "flowise_tts_config_update_admin"
  on public.flowise_tts_config for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ========== 2. flowise_chatflow_tts (per-chatflow voice override) ==========
create table if not exists public.flowise_chatflow_tts (
  chatflow_id text primary key,
  tts_voice text not null,
  updated_at timestamptz not null default now()
);

comment on table public.flowise_chatflow_tts is 'Optional per-chatflow TTS voice override for read-aloud in Dojo.';
comment on column public.flowise_chatflow_tts.chatflow_id is 'Flowise chatflow id.';
comment on column public.flowise_chatflow_tts.tts_voice is 'OpenAI voice id for this chatflow.';

alter table public.flowise_chatflow_tts enable row level security;

-- Authenticated: read (for resolving effective voice in API)
create policy "flowise_chatflow_tts_select_authenticated"
  on public.flowise_chatflow_tts for select
  to authenticated
  using (true);

-- Admin only: insert/update/delete
create policy "flowise_chatflow_tts_insert_admin"
  on public.flowise_chatflow_tts for insert
  to authenticated
  with check (public.is_admin());

create policy "flowise_chatflow_tts_update_admin"
  on public.flowise_chatflow_tts for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "flowise_chatflow_tts_delete_admin"
  on public.flowise_chatflow_tts for delete
  to authenticated
  using (public.is_admin());

grant select on public.flowise_tts_config to authenticated;
grant update on public.flowise_tts_config to authenticated;
grant select, insert, update, delete on public.flowise_chatflow_tts to authenticated;
