-- Migration: add connection_type to main_elevenlabs_config
-- Purpose: Allow LABZ to choose WebRTC or WebSocket for Main voice (ElevenLabs agents).
-- Same pattern as eleven_labs_config.connection_type.

alter table public.main_elevenlabs_config
  add column if not exists connection_type text not null default 'webrtc'
  check (connection_type in ('webrtc', 'websocket'));

comment on column public.main_elevenlabs_config.connection_type is 'ElevenLabs agent connection: webrtc (default) or websocket.';
