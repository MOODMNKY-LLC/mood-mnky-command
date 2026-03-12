-- MOOD MNKY Lab – Profiles username constraints (Supabase User Management pattern)
-- Purpose: Add unique constraint and length check on profiles.username so it aligns
--          with the official tutorial (username unique, char_length >= 3).
-- Affected: public.profiles
-- No RLS or trigger changes.

-- ========== 1. Data cleanup (before adding constraints) ==========
-- Set invalid usernames (length < 3) to null so the check constraint can be added.
update public.profiles
set username = null
where username is not null and char_length(trim(username)) < 3;

-- Normalize empty string to null.
update public.profiles
set username = null
where username is not null and trim(username) = '';

-- Resolve duplicate non-null usernames: keep first by created_at, clear the rest.
with duplicates as (
  select id, username,
    row_number() over (partition by username order by created_at nulls last, id) as rn
  from public.profiles
  where username is not null
)
update public.profiles p
set username = null
from duplicates d
where p.id = d.id and d.rn > 1;

-- ========== 2. Unique index on username (allows multiple NULLs) ==========
create unique index if not exists profiles_username_key
  on public.profiles (username)
  where username is not null;

-- ========== 3. Check constraint: username length >= 3 when set ==========
alter table public.profiles
  drop constraint if exists profiles_username_length;

alter table public.profiles
  add constraint profiles_username_length
  check (username is null or char_length(username) >= 3);

comment on constraint profiles_username_length on public.profiles is
  'Username must be at least 3 characters when set; aligns with Supabase User Management tutorial.';
