-- Discord control panel: guild configs, webhooks (encrypted tokens), templates, action logs.
-- RLS: only admins (public.is_admin()) can access. API uses service role or authenticated admin.

-- Guild configs (optional per-guild settings in LABZ)
create table public.discord_guild_configs (
  id uuid primary key default gen_random_uuid(),
  guild_id text not null unique,
  display_name text,
  primary_channels jsonb default '{}'::jsonb,
  allowed_actions jsonb default '{}'::jsonb,
  rate_limit_settings jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.discord_guild_configs is 'Per-guild settings for LABZ Discord control panel.';
create index discord_guild_configs_guild_id_idx on public.discord_guild_configs (guild_id);

alter table public.discord_guild_configs enable row level security;

create policy "discord_guild_configs_admin_all"
  on public.discord_guild_configs for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Webhooks: store Discord webhook id + encrypted token (token returned only once on create)
create table public.discord_webhooks (
  id uuid primary key default gen_random_uuid(),
  webhook_id text not null,
  channel_id text not null,
  guild_id text not null,
  name text not null,
  avatar text,
  token_encrypted text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  unique (webhook_id)
);

comment on table public.discord_webhooks is 'Stored Discord webhooks; token_encrypted must be decrypted server-side only.';
create index discord_webhooks_guild_id_idx on public.discord_webhooks (guild_id);
create index discord_webhooks_channel_id_idx on public.discord_webhooks (channel_id);

alter table public.discord_webhooks enable row level security;

create policy "discord_webhooks_admin_all"
  on public.discord_webhooks for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Webhook templates (Discohook-style payloads: content, embeds, components, allowed_mentions)
create table public.discord_webhook_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.discord_webhook_templates is 'Saved webhook message templates (embeds, content, components).';
alter table public.discord_webhook_templates enable row level security;

create policy "discord_webhook_templates_admin_all"
  on public.discord_webhook_templates for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Action logs (what LABZ users triggered; includes audit reason sent to Discord)
create table public.discord_action_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  action_type text not null,
  guild_id text,
  details jsonb default '{}'::jsonb,
  audit_reason text,
  created_at timestamptz not null default now()
);

comment on table public.discord_action_logs is 'Log of Discord actions triggered from LABZ (moderation, webhooks, etc.).';
create index discord_action_logs_guild_id_idx on public.discord_action_logs (guild_id);
create index discord_action_logs_created_at_idx on public.discord_action_logs (created_at desc);

alter table public.discord_action_logs enable row level security;

create policy "discord_action_logs_admin_all"
  on public.discord_action_logs for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Grants for authenticated (RLS will restrict to admins)
grant select, insert, update, delete on public.discord_guild_configs to authenticated;
grant select, insert, update, delete on public.discord_webhooks to authenticated;
grant select, insert, update, delete on public.discord_webhook_templates to authenticated;
grant select, insert on public.discord_action_logs to authenticated;
