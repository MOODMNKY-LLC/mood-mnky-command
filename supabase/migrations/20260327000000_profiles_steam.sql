-- Steam account linking: SteamID64 and cached profile for MNKY GAMES service.
-- Used by GET /api/auth/steam/callback and GET /api/me/steam. RLS unchanged (profiles select/update own).

alter table public.profiles
  add column if not exists steamid64 text unique,
  add column if not exists steam_linked_at timestamptz,
  add column if not exists steam_profile_cache jsonb;

comment on column public.profiles.steamid64 is 'SteamID64 from Steam OpenID 2.0; one Steam account per app user.';
comment on column public.profiles.steam_linked_at is 'When the user linked their Steam account.';
comment on column public.profiles.steam_profile_cache is 'Cached snapshot from Steam GetPlayerSummaries (personaname, avatar, avatarfull, personastate, etc.) for UI; avoids live API on page load.';

-- Optional: for future "Scent Mode: Now Playing" / agent tools (GetRecentlyPlayedGames sync).
-- alter table public.profiles add column if not exists steam_signals jsonb;
-- comment on column public.profiles.steam_signals is 'Derived signals: recent games, playtime; populated by sync job.';
