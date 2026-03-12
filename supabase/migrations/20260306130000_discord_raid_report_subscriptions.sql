-- Discord raid report subscriptions: post Hydaelyn FFLogs report summaries to a channel.
-- filters: { "all": true } or { "reportCodes": ["code1", "code2"] }. webhook_url: full Discord webhook URL for posting (optional if using bot later).

create table if not exists public.discord_raid_report_subscriptions (
  id uuid primary key default gen_random_uuid(),
  guild_id text not null,
  channel_id text not null,
  webhook_url text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.discord_raid_report_subscriptions is 'Channels to post raid report summaries to when an import job completes.';

create index discord_raid_report_subscriptions_created_by_idx on public.discord_raid_report_subscriptions(created_by);
create index discord_raid_report_subscriptions_guild_id_idx on public.discord_raid_report_subscriptions(guild_id);

alter table public.discord_raid_report_subscriptions enable row level security;

create policy "discord_raid_report_subscriptions_select_own"
  on public.discord_raid_report_subscriptions for select to authenticated
  using (created_by = auth.uid());
create policy "discord_raid_report_subscriptions_insert_own"
  on public.discord_raid_report_subscriptions for insert to authenticated
  with check (created_by = auth.uid());
create policy "discord_raid_report_subscriptions_update_own"
  on public.discord_raid_report_subscriptions for update to authenticated
  using (created_by = auth.uid());
create policy "discord_raid_report_subscriptions_delete_own"
  on public.discord_raid_report_subscriptions for delete to authenticated
  using (created_by = auth.uid());

