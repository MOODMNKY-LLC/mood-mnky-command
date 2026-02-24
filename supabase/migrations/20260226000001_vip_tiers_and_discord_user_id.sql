-- VIP tiers config (level -> display name) and profiles.discord_user_id for Discord role sync.
-- Purpose: Named tiers (Bronze/Silver/Gold) from config; Discord role-by-level needs profile's Discord id.

-- ========== 1. Seed vip_tiers in config_xp_rules ==========
insert into public.config_xp_rules (key, value, updated_at)
values (
  'vip_tiers',
  '[
    {"level": 1, "name": "Bronze"},
    {"level": 2, "name": "Silver"},
    {"level": 3, "name": "Gold"},
    {"level": 4, "name": "Platinum"},
    {"level": 5, "name": "Diamond"}
  ]'::jsonb,
  now()
)
on conflict (key) do update set
  value = excluded.value,
  updated_at = excluded.updated_at;

-- ========== 2. profiles.discord_user_id for Discord role sync ==========
alter table public.profiles
  add column if not exists discord_user_id text;

comment on column public.profiles.discord_user_id is 'Discord user id (snowflake) when user has linked Discord; used for role-by-level sync.';

create index if not exists profiles_discord_user_id_idx on public.profiles(discord_user_id)
  where discord_user_id is not null;
