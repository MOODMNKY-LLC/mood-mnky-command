-- Migration: add UI toggles for Main ElevenLabs voice block
-- show_transcript_viewer: show transcript in voice block when available
-- show_waveform_in_voice_block: show waveform visualization next to Orb

alter table public.main_elevenlabs_config
  add column if not exists show_transcript_viewer boolean not null default false,
  add column if not exists show_waveform_in_voice_block boolean not null default false;

comment on column public.main_elevenlabs_config.show_transcript_viewer is 'When true, show transcript viewer in Main voice block when transcript data is available.';
comment on column public.main_elevenlabs_config.show_waveform_in_voice_block is 'When true, show waveform visualization in Main voice block.';
