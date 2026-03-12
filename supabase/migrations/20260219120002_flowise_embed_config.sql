-- Flowise embed config: stored settings for FlowiseChatEmbed (chatflow_id, api_host, theme, overrideConfig).
-- Used by LABZ Embed Config UI and Dojo Flowise bubble. Single row per scope (e.g. dojo).
-- RLS: anon can select (embed needs config); only admins can insert/update/delete.

create table if not exists public.flowise_embed_config (
  id uuid primary key default gen_random_uuid(),
  scope text not null unique,
  chatflow_id text not null,
  api_host text not null,
  theme jsonb default '{}',
  chatflow_config jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.flowise_embed_config is 'Flowise embed settings per scope (dojo, etc.): chatflow_id, api_host, theme, overrideConfig for BubbleChat.';
comment on column public.flowise_embed_config.scope is 'Scope identifier, e.g. dojo for Blending Lab bubble.';
comment on column public.flowise_embed_config.theme is 'Theme object for FlowiseChatEmbed: button, chatWindow, customCSS, etc.';
comment on column public.flowise_embed_config.chatflow_config is 'overrideConfig passed to Predict API: topK, systemMessage, vars, etc.';

create index if not exists flowise_embed_config_scope_idx on public.flowise_embed_config (scope);

-- Updated_at trigger
create or replace function public.flowise_embed_config_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists flowise_embed_config_updated_at on public.flowise_embed_config;
create trigger flowise_embed_config_updated_at
  before update on public.flowise_embed_config
  for each row execute function public.flowise_embed_config_updated_at();

alter table public.flowise_embed_config enable row level security;

-- Policies: drop if exists so migration is idempotent when table already existed
drop policy if exists "flowise_embed_config_select_anon" on public.flowise_embed_config;
drop policy if exists "flowise_embed_config_select_authenticated" on public.flowise_embed_config;
drop policy if exists "flowise_embed_config_insert_admin" on public.flowise_embed_config;
drop policy if exists "flowise_embed_config_update_admin" on public.flowise_embed_config;
drop policy if exists "flowise_embed_config_delete_admin" on public.flowise_embed_config;

create policy "flowise_embed_config_select_anon"
  on public.flowise_embed_config for select to anon
  using (true);

create policy "flowise_embed_config_select_authenticated"
  on public.flowise_embed_config for select to authenticated
  using (true);

create policy "flowise_embed_config_insert_admin"
  on public.flowise_embed_config for insert to authenticated
  with check (public.is_admin());

create policy "flowise_embed_config_update_admin"
  on public.flowise_embed_config for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "flowise_embed_config_delete_admin"
  on public.flowise_embed_config for delete to authenticated
  using (public.is_admin());
