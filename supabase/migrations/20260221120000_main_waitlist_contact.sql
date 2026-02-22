-- Main site (www.moodmnky.com) – waitlist and contact submissions
-- Server-only inserts via API routes using service role; RLS restricts reads to admin.

-- ========== main_waitlist ==========
create table if not exists public.main_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text,
  created_at timestamptz default now()
);

create index if not exists idx_main_waitlist_created_at
  on public.main_waitlist (created_at desc);

alter table public.main_waitlist enable row level security;

-- Only admins can read waitlist entries
create policy "main_waitlist_select_admin"
  on public.main_waitlist for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Inserts are done server-side via service role (bypasses RLS)

-- ========== main_contact_submissions ==========
create table if not exists public.main_contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_main_contact_submissions_created_at
  on public.main_contact_submissions (created_at desc);

alter table public.main_contact_submissions enable row level security;

-- Only admins can read contact submissions
create policy "main_contact_submissions_select_admin"
  on public.main_contact_submissions for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Inserts are done server-side via service role (bypasses RLS)
