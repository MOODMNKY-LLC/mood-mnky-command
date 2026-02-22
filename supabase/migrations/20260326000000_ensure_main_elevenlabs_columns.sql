-- Ensure main_elevenlabs_config has all columns expected by the app (fixes "connection_type not in schema cache").
-- Safe to run multiple times (add column if not exists).
-- Run: supabase db push  OR  supabase migration up

-- connection_type (from 20260222100000)
alter table public.main_elevenlabs_config
  add column if not exists connection_type text not null default 'webrtc'
  check (connection_type in ('webrtc', 'websocket'));

-- UI toggles (from 20260222100002)
alter table public.main_elevenlabs_config
  add column if not exists show_transcript_viewer boolean not null default false,
  add column if not exists show_waveform_in_voice_block boolean not null default false;
