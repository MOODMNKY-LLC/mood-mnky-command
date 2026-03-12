-- Migration: MNKY VERSE gamification (XP, quests, Discord events, rewards) and UGC submissions
-- Purpose: Ledger-based XP, quest progress, Discord event log, rewards/claims, UGC with moderation.
-- All profile_id reference public.profiles(id).

-- ========== 1. XP ledger (append-only; never overwrite) ==========
create table if not exists public.xp_ledger (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  source text not null,
  source_ref text,
  xp_delta int not null,
  reason text,
  created_at timestamptz default now()
);

comment on table public.xp_ledger is 'Append-only XP ledger; all awards go here.';

create index xp_ledger_profile_created_idx on public.xp_ledger(profile_id, created_at desc);

alter table public.xp_ledger enable row level security;

create policy "xp_ledger_select_own"
  on public.xp_ledger for select to authenticated using (auth.uid() = profile_id);
create policy "xp_ledger_insert_service"
  on public.xp_ledger for insert to authenticated with check (public.is_admin());
create policy "xp_ledger_select_admin"
  on public.xp_ledger for select to authenticated using (public.is_admin());

-- ========== 2. XP state (materialized total and level per profile) ==========
create table if not exists public.xp_state (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  xp_total int not null default 0 check (xp_total >= 0),
  level int not null default 1 check (level >= 1),
  updated_at timestamptz default now()
);

comment on table public.xp_state is 'Materialized XP total and level; updated when awarding XP.';

alter table public.xp_state enable row level security;

create policy "xp_state_select_own"
  on public.xp_state for select to authenticated using (auth.uid() = profile_id);
create policy "xp_state_insert_service"
  on public.xp_state for insert to authenticated with check (public.is_admin());
create policy "xp_state_update_service"
  on public.xp_state for update to authenticated using (public.is_admin());
create policy "xp_state_select_admin"
  on public.xp_state for select to authenticated using (public.is_admin());

-- ========== 3. Discord event ledger (bot posts normalized events here) ==========
create table if not exists public.discord_event_ledger (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  discord_user_id text not null,
  guild_id text not null,
  channel_id text,
  event_type text not null,
  event_ref text,
  value int default 1,
  created_at timestamptz default now()
);

comment on table public.discord_event_ledger is 'Discord events (joined, message, reaction, voice_minutes, etc.) for quest evaluation.';

create index discord_event_ledger_profile_time_idx on public.discord_event_ledger(profile_id, created_at desc);
create index discord_event_ledger_guild_created_idx on public.discord_event_ledger(guild_id, created_at desc);

alter table public.discord_event_ledger enable row level security;

create policy "discord_event_ledger_select_own"
  on public.discord_event_ledger for select to authenticated using (auth.uid() = profile_id);
create policy "discord_event_ledger_insert_service"
  on public.discord_event_ledger for insert to authenticated with check (public.is_admin());
create policy "discord_event_ledger_select_admin"
  on public.discord_event_ledger for select to authenticated using (public.is_admin());

-- ========== 4. Seasons (optional; for seasonal XP/quests) ==========
create table if not exists public.mnky_seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz default now()
);

comment on table public.mnky_seasons is 'Optional seasons for XP/quest windows.';

alter table public.mnky_seasons enable row level security;

create policy "mnky_seasons_select_authenticated"
  on public.mnky_seasons for select to authenticated using (true);
create policy "mnky_seasons_insert_admin"
  on public.mnky_seasons for insert to authenticated with check (public.is_admin());
create policy "mnky_seasons_update_admin"
  on public.mnky_seasons for update to authenticated using (public.is_admin());
create policy "mnky_seasons_delete_admin"
  on public.mnky_seasons for delete to authenticated using (public.is_admin());

-- ========== 5. Rewards (discount codes, roles, badges, etc.) ==========
create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('discount_code', 'product_access', 'discord_role', 'digital_badge', 'early_access')),
  payload jsonb not null default '{}'::jsonb,
  min_level int,
  rule jsonb,
  active boolean not null default true,
  created_at timestamptz default now()
);

comment on table public.rewards is 'Reward definitions; min_level or rule (jsonb) gates eligibility.';

alter table public.rewards enable row level security;

create policy "rewards_select_authenticated"
  on public.rewards for select to authenticated using (true);
create policy "rewards_insert_admin"
  on public.rewards for insert to authenticated with check (public.is_admin());
create policy "rewards_update_admin"
  on public.rewards for update to authenticated using (public.is_admin());
create policy "rewards_delete_admin"
  on public.rewards for delete to authenticated using (public.is_admin());

-- ========== 6. Reward claims (issued to profiles) ==========
create table if not exists public.reward_claims (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  reward_id uuid not null references public.rewards(id) on delete cascade,
  status text not null default 'issued' check (status in ('issued', 'redeemed', 'revoked')),
  issued_at timestamptz default now()
);

comment on table public.reward_claims is 'Rewards issued to profiles; status tracked for redemption.';

create index reward_claims_profile_idx on public.reward_claims(profile_id);
create index reward_claims_reward_idx on public.reward_claims(reward_id);

alter table public.reward_claims enable row level security;

create policy "reward_claims_select_own"
  on public.reward_claims for select to authenticated using (auth.uid() = profile_id);
create policy "reward_claims_insert_service"
  on public.reward_claims for insert to authenticated with check (public.is_admin());
create policy "reward_claims_update_service"
  on public.reward_claims for update to authenticated using (public.is_admin());
create policy "reward_claims_select_admin"
  on public.reward_claims for select to authenticated using (public.is_admin());

-- ========== 7. Quests (DSL in rule jsonb) ==========
create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  title text not null,
  description text,
  rule jsonb not null default '{}'::jsonb,
  xp_reward int default 0,
  season_id uuid references public.mnky_seasons(id) on delete set null,
  active boolean not null default true,
  cooldown_days int default 0,
  requires_purchase boolean default false,
  requires_discord_link boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.quests is 'Quest definitions; rule jsonb holds requirements and rewards DSL.';

create index quests_season_active_idx on public.quests(season_id, active);

alter table public.quests enable row level security;

create policy "quests_select_authenticated"
  on public.quests for select to authenticated using (true);
create policy "quests_select_anon_active"
  on public.quests for select to anon using (active = true);
create policy "quests_insert_admin"
  on public.quests for insert to authenticated with check (public.is_admin());
create policy "quests_update_admin"
  on public.quests for update to authenticated using (public.is_admin());
create policy "quests_delete_admin"
  on public.quests for delete to authenticated using (public.is_admin());

-- ========== 8. Quest progress (per profile per quest) ==========
create table if not exists public.quest_progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (profile_id, quest_id)
);

comment on table public.quest_progress is 'Per-profile quest progress; completed_at set when requirements met.';

create index quest_progress_profile_idx on public.quest_progress(profile_id);
create index quest_progress_quest_idx on public.quest_progress(quest_id);

alter table public.quest_progress enable row level security;

create policy "quest_progress_select_own"
  on public.quest_progress for select to authenticated using (auth.uid() = profile_id);
create policy "quest_progress_insert_own"
  on public.quest_progress for insert to authenticated with check (auth.uid() = profile_id);
create policy "quest_progress_update_own"
  on public.quest_progress for update to authenticated using (auth.uid() = profile_id);
create policy "quest_progress_select_admin"
  on public.quest_progress for select to authenticated using (public.is_admin());
create policy "quest_progress_update_admin"
  on public.quest_progress for update to authenticated using (public.is_admin());

-- ========== 9. UGC submissions (photo/video/story; moderation workflow) ==========
create table if not exists public.ugc_submissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  collection_id uuid references public.mnky_collections(id) on delete set null,
  type text not null check (type in ('photo', 'video', 'story')),
  caption text,
  media_path text not null,
  media_hash text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  moderation_notes text,
  created_at timestamptz default now(),
  unique (media_hash)
);

comment on table public.ugc_submissions is 'UGC submissions; media_hash dedupe; status pending -> approved|rejected.';

create index ugc_submissions_profile_status_idx on public.ugc_submissions(profile_id, status);
create index ugc_submissions_collection_status_idx on public.ugc_submissions(collection_id, status);
create index ugc_submissions_created_idx on public.ugc_submissions(created_at desc);

alter table public.ugc_submissions enable row level security;

create policy "ugc_submissions_select_own"
  on public.ugc_submissions for select to authenticated using (auth.uid() = profile_id);
create policy "ugc_submissions_insert_own"
  on public.ugc_submissions for insert to authenticated with check (auth.uid() = profile_id);
create policy "ugc_submissions_select_admin"
  on public.ugc_submissions for select to authenticated using (public.is_admin());
create policy "ugc_submissions_update_admin"
  on public.ugc_submissions for update to authenticated using (public.is_admin());

-- ========== 10. Config for XP rules (optional; single row or keyed) ==========
create table if not exists public.config_xp_rules (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

comment on table public.config_xp_rules is 'XP rules config (e.g. purchase tiers, mag_read, quiz_pass).';

alter table public.config_xp_rules enable row level security;

create policy "config_xp_rules_select_authenticated"
  on public.config_xp_rules for select to authenticated using (true);
create policy "config_xp_rules_insert_admin"
  on public.config_xp_rules for insert to authenticated with check (public.is_admin());
create policy "config_xp_rules_update_admin"
  on public.config_xp_rules for update to authenticated using (public.is_admin());
create policy "config_xp_rules_delete_admin"
  on public.config_xp_rules for delete to authenticated using (public.is_admin());
