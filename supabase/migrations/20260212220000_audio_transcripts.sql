-- MOOD MNKY Lab: Create audio_transcripts table for STT/translation results
-- Purpose: Store transcription and translation outputs with provenance

create table if not exists public.audio_transcripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_asset_id uuid references public.media_assets(id) on delete set null,
  task_type text not null check (task_type in ('transcribe', 'translate')),
  model text not null,
  response_format text,
  raw_text text,
  segments jsonb,
  usage_json jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_audio_transcripts_user on public.audio_transcripts(user_id);
create index if not exists idx_audio_transcripts_source on public.audio_transcripts(source_asset_id);

alter table public.audio_transcripts enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'audio_transcripts' and policyname = 'audio_transcripts_select_own') then
    create policy "audio_transcripts_select_own" on public.audio_transcripts for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'audio_transcripts' and policyname = 'audio_transcripts_insert_own') then
    create policy "audio_transcripts_insert_own" on public.audio_transcripts for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'audio_transcripts' and policyname = 'audio_transcripts_update_own') then
    create policy "audio_transcripts_update_own" on public.audio_transcripts for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'audio_transcripts' and policyname = 'audio_transcripts_delete_own') then
    create policy "audio_transcripts_delete_own" on public.audio_transcripts for delete using (auth.uid() = user_id);
  end if;
end
$$;
