-- agent_profiles: Verse/Labz chat agents with OpenAI/ElevenLabs config.
-- Used by /api/labz/agents, /api/verse/agents, /chat/agents, etc.

create table if not exists public.agent_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null default '',
  blurb text,
  image_path text,
  openai_model text,
  openai_voice text,
  system_instructions text,
  tools jsonb not null default '[]'::jsonb,
  eleven_labs_agent_id text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.agent_profiles is 'Verse/Labz chat agent definitions; admin-managed via /chat/agents.';

alter table public.agent_profiles enable row level security;

-- Public read for active agents (Verse, anon)
create policy "public_read_active_agent_profiles"
  on public.agent_profiles for select
  to anon, authenticated
  using (is_active = true);

-- Admin full access (Labz)
create policy "admin_all_agent_profiles"
  on public.agent_profiles for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and (role = 'admin' or is_admin = true)
    )
  );

-- Trigger to refresh updated_at
create or replace function public.set_agent_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists agent_profiles_updated_at on public.agent_profiles;
create trigger agent_profiles_updated_at
  before update on public.agent_profiles
  for each row execute function public.set_agent_profiles_updated_at();
