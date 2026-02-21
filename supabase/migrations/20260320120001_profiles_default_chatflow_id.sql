-- Add default_chatflow_id to profiles so Dojo can open a specific chatflow when no URL param.
-- Purpose: User or admin sets preferred default; Dojo chat page uses URL chatflowId > profile default > first assignment > embed config.
-- Affected: public.profiles

alter table public.profiles
  add column if not exists default_chatflow_id text;

comment on column public.profiles.default_chatflow_id is 'Preferred Flowise chatflow id for Dojo chat when no chatflowId in URL.';
