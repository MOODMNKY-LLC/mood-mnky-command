-- MOOD MNKY Lab: Add audio/TTS metadata columns to media_assets
-- Purpose: Support Audio Studio TTS outputs and audio asset metadata

alter table public.media_assets
  add column if not exists duration_seconds numeric,
  add column if not exists audio_codec text,
  add column if not exists sample_rate int,
  add column if not exists tts_voice_id text,
  add column if not exists tts_model text,
  add column if not exists tts_instructions text,
  add column if not exists tts_speed numeric;

comment on column public.media_assets.duration_seconds is 'Duration in seconds for audio/video';
comment on column public.media_assets.audio_codec is 'e.g. mp3, wav, opus';
comment on column public.media_assets.tts_voice_id is 'Built-in voice name or custom voice OpenAI ID';
comment on column public.media_assets.tts_model is 'e.g. gpt-4o-mini-tts';
