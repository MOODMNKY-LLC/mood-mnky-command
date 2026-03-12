-- Multi-tenant Supabase (MT) — profiles table for portal users.
-- Purpose: Store display name, avatar, and active_tenant_id for users in MT auth.
-- Run only against the MT Supabase project.

-- =============================================================================
-- profiles
-- =============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  active_tenant_id uuid references public.tenants(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.profiles is 'User profiles for MT portal; display_name, avatar_url, active_tenant_id.';
comment on column public.profiles.active_tenant_id is 'Currently selected tenant; must be one the user belongs to (or null).';

create index if not exists idx_profiles_active_tenant_id on public.profiles(active_tenant_id);

alter table public.profiles enable row level security;

-- Users can read and update their own profile.
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Insert: only via trigger (handle_new_user) or service role.
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- =============================================================================
-- Trigger: insert profile on signup
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
