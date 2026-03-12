-- MOOD MNKY Lab: Voice Lab tables for custom voice consent and creation
-- Purpose: Store OpenAI voice consent IDs and custom voice metadata

create table if not exists public.voice_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  openai_consent_id text not null unique,
  name text,
  language text,
  created_at timestamptz default now()
);

create table if not exists public.custom_voices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_id uuid not null references public.voice_consents(id) on delete restrict,
  openai_voice_id text not null unique,
  name text not null,
  created_at timestamptz default now()
);

create index if not exists idx_voice_consents_user on public.voice_consents(user_id);
create index if not exists idx_voice_consents_openai on public.voice_consents(openai_consent_id);
create index if not exists idx_custom_voices_user on public.custom_voices(user_id);
create index if not exists idx_custom_voices_consent on public.custom_voices(consent_id);
create index if not exists idx_custom_voices_openai on public.custom_voices(openai_voice_id);

alter table public.voice_consents enable row level security;
alter table public.custom_voices enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'voice_consents' and policyname = 'voice_consents_select_own') then
    create policy "voice_consents_select_own" on public.voice_consents for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'voice_consents' and policyname = 'voice_consents_insert_own') then
    create policy "voice_consents_insert_own" on public.voice_consents for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'voice_consents' and policyname = 'voice_consents_update_own') then
    create policy "voice_consents_update_own" on public.voice_consents for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'voice_consents' and policyname = 'voice_consents_delete_own') then
    create policy "voice_consents_delete_own" on public.voice_consents for delete using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'custom_voices' and policyname = 'custom_voices_select_own') then
    create policy "custom_voices_select_own" on public.custom_voices for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'custom_voices' and policyname = 'custom_voices_insert_own') then
    create policy "custom_voices_insert_own" on public.custom_voices for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'custom_voices' and policyname = 'custom_voices_update_own') then
    create policy "custom_voices_update_own" on public.custom_voices for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'custom_voices' and policyname = 'custom_voices_delete_own') then
    create policy "custom_voices_delete_own" on public.custom_voices for delete using (auth.uid() = user_id);
  end if;
end
$$;
