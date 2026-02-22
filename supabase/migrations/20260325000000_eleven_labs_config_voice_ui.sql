-- Migration: add default_voice_id and voice-block UI toggles to eleven_labs_config
-- Purpose: Align Verse/Chat ElevenLabs config with Main (default voice, transcript, waveform).
-- Used by: GET/PATCH /api/chat/eleven-labs-config, LABZ Eleven Labs (Verse / Chat) page.

alter table public.eleven_labs_config
  add column if not exists default_voice_id text,
  add column if not exists show_transcript_viewer boolean not null default false,
  add column if not exists show_waveform_in_voice_block boolean not null default false;

comment on column public.eleven_labs_config.default_voice_id is 'Optional default voice ID for Verse/LABZ voice picker.';
comment on column public.eleven_labs_config.show_transcript_viewer is 'When true, show transcript viewer in voice UI when transcript data is available.';
comment on column public.eleven_labs_config.show_waveform_in_voice_block is 'When true, show waveform visualization in voice block.';
