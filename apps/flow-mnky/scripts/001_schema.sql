-- Migration 001: Core tables for Flowise Console
-- Profiles, chats, projects, images

-- ── Profiles ──────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  display_name text,
  avatar_url  text,
  role        text not null default 'user'
    check (role in ('user', 'workspace_admin', 'tenant_admin', 'platform_admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"  on public.profiles for select  using (auth.uid() = id);
create policy "profiles_insert_own"  on public.profiles for insert  with check (auth.uid() = id);
create policy "profiles_update_own"  on public.profiles for update  using (auth.uid() = id);
create policy "profiles_delete_own"  on public.profiles for delete  using (auth.uid() = id);

-- ── Projects ──────────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  description  text,
  emoji        text default '📁',
  color        text default '#6b7280',
  chatflow_id  text,
  pinned       boolean not null default false,
  archived     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "projects_select_own"  on public.projects for select  using (auth.uid() = user_id);
create policy "projects_insert_own"  on public.projects for insert  with check (auth.uid() = user_id);
create policy "projects_update_own"  on public.projects for update  using (auth.uid() = user_id);
create policy "projects_delete_own"  on public.projects for delete  using (auth.uid() = user_id);

-- ── Chats ─────────────────────────────────────────────────────────────────────
create table if not exists public.chats (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  project_id       uuid references public.projects(id) on delete set null,
  title            text not null default 'New Chat',
  chatflow_id      text,
  chatflow_name    text,
  flowise_chat_id  text,
  pinned           boolean not null default false,
  archived         boolean not null default false,
  shared           boolean not null default false,
  message_count    int not null default 0,
  last_message_at  timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.chats enable row level security;

create policy "chats_select_own"  on public.chats for select  using (auth.uid() = user_id);
create policy "chats_insert_own"  on public.chats for insert  with check (auth.uid() = user_id);
create policy "chats_update_own"  on public.chats for update  using (auth.uid() = user_id);
create policy "chats_delete_own"  on public.chats for delete  using (auth.uid() = user_id);

-- ── Chat Messages ─────────────────────────────────────────────────────────────
create table if not exists public.chat_messages (
  id               uuid primary key default gen_random_uuid(),
  chat_id          uuid not null references public.chats(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  role             text not null check (role in ('user', 'assistant')),
  content          text not null,
  source_documents jsonb,
  used_tools       jsonb,
  created_at       timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "messages_select_own"  on public.chat_messages for select  using (auth.uid() = user_id);
create policy "messages_insert_own"  on public.chat_messages for insert  with check (auth.uid() = user_id);
create policy "messages_delete_own"  on public.chat_messages for delete  using (auth.uid() = user_id);

-- ── User Images ───────────────────────────────────────────────────────────────
create table if not exists public.user_images (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  chat_id      uuid references public.chats(id) on delete set null,
  project_id   uuid references public.projects(id) on delete set null,
  storage_path text not null,
  file_name    text not null,
  mime_type    text not null default 'image/png',
  size_bytes   bigint,
  width        int,
  height       int,
  caption      text,
  created_at   timestamptz not null default now()
);

alter table public.user_images enable row level security;

create policy "images_select_own"  on public.user_images for select  using (auth.uid() = user_id);
create policy "images_insert_own"  on public.user_images for insert  with check (auth.uid() = user_id);
create policy "images_delete_own"  on public.user_images for delete  using (auth.uid() = user_id);

-- ── Auto-profile trigger ──────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists chats_user_updated on public.chats (user_id, updated_at desc);
create index if not exists chats_project on public.chats (project_id);
create index if not exists messages_chat on public.chat_messages (chat_id, created_at asc);
create index if not exists images_user on public.user_images (user_id, created_at desc);
