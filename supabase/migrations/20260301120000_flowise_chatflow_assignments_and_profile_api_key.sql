-- Flowise Dojo user-scoped config: chatflow assignments and per-user API key.
-- Purpose: Allow admins to assign chatflows to users; users can only override config for assigned
--          chatflows. Higher-tier members can store a Flowise API key (encrypted) for their own access.
-- Affected: new table flowise_chatflow_assignments; profiles (new columns).

-- ========== 1. flowise_chatflow_assignments ==========
create table if not exists public.flowise_chatflow_assignments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  chatflow_id text not null,
  display_name text,
  override_config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, chatflow_id)
);

comment on table public.flowise_chatflow_assignments is 'Chatflows assigned to Dojo users; users can only read/update override_config for their own rows.';
comment on column public.flowise_chatflow_assignments.override_config is 'Override config passed to Flowise Predict API: systemMessage, vars, topK, etc.';

create index if not exists flowise_chatflow_assignments_profile_id_idx
  on public.flowise_chatflow_assignments (profile_id);
create index if not exists flowise_chatflow_assignments_chatflow_id_idx
  on public.flowise_chatflow_assignments (chatflow_id);

-- updated_at trigger
create or replace function public.flowise_chatflow_assignments_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists flowise_chatflow_assignments_updated_at on public.flowise_chatflow_assignments;
create trigger flowise_chatflow_assignments_updated_at
  before update on public.flowise_chatflow_assignments
  for each row execute function public.flowise_chatflow_assignments_updated_at();

alter table public.flowise_chatflow_assignments enable row level security;

-- RLS: users select/update own rows; only admins insert/delete
drop policy if exists "flowise_chatflow_assignments_select_own" on public.flowise_chatflow_assignments;
create policy "flowise_chatflow_assignments_select_own"
  on public.flowise_chatflow_assignments for select to authenticated
  using (profile_id = auth.uid());

drop policy if exists "flowise_chatflow_assignments_update_own" on public.flowise_chatflow_assignments;
create policy "flowise_chatflow_assignments_update_own"
  on public.flowise_chatflow_assignments for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists "flowise_chatflow_assignments_insert_admin" on public.flowise_chatflow_assignments;
create policy "flowise_chatflow_assignments_insert_admin"
  on public.flowise_chatflow_assignments for insert to authenticated
  with check (public.is_admin());

drop policy if exists "flowise_chatflow_assignments_delete_admin" on public.flowise_chatflow_assignments;
create policy "flowise_chatflow_assignments_delete_admin"
  on public.flowise_chatflow_assignments for delete to authenticated
  using (public.is_admin());

grant select, update on public.flowise_chatflow_assignments to authenticated;
grant insert, delete on public.flowise_chatflow_assignments to authenticated;

-- ========== 2. profiles: Flowise API key (encrypted) and verified_at ==========
alter table public.profiles
  add column if not exists flowise_api_key_encrypted text,
  add column if not exists flowise_api_key_verified_at timestamptz;

comment on column public.profiles.flowise_api_key_encrypted is 'Encrypted Flowise API key for user; decrypt server-side only. Higher-tier (user/moderator/admin) only.';
comment on column public.profiles.flowise_api_key_verified_at is 'When the stored Flowise API key was last verified against Flowise.';
