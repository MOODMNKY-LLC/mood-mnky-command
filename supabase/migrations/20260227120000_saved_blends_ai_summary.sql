-- saved_blends: add ai_summary column for Dojo Blending Lab
-- Purpose: Store AI-generated fragrance description separately from user notes.
-- Affected: public.saved_blends

alter table public.saved_blends
  add column if not exists ai_summary text;

comment on column public.saved_blends.ai_summary is
  'AI-generated fragrance description from Dojo Blending Lab';
