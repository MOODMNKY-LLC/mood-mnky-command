-- Migration: MNKY Collection Manga/Magazine tables
-- Purpose: Core content and telemetry for per-collection issues (chapters, panels, hotspots)
-- and read/download/quiz events used for XP. All profile_id reference public.profiles(id).
-- Affected: new tables mnky_collections, mnky_issues, mnky_chapters, mnky_panels,
--           mnky_hotspots, mnky_read_events, mnky_download_events, mnky_quiz_attempts

-- ========== 1. Collections (e.g. World Traveler Series) ==========
create table if not exists public.mnky_collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  shopify_collection_gid text,
  created_at timestamptz default now()
);

comment on table public.mnky_collections is 'Manga/magazine collection (e.g. World Traveler Series); one issue per collection.';

alter table public.mnky_collections enable row level security;

-- Admin/managers manage collections; anon can read published collection metadata if needed later.
create policy "mnky_collections_select_authenticated"
  on public.mnky_collections for select to authenticated using (true);
create policy "mnky_collections_insert_admin"
  on public.mnky_collections for insert to authenticated with check (public.is_admin());
create policy "mnky_collections_update_admin"
  on public.mnky_collections for update to authenticated using (public.is_admin());
create policy "mnky_collections_delete_admin"
  on public.mnky_collections for delete to authenticated using (public.is_admin());

-- ========== 2. Issues (one per collection, e.g. Issue 01: Passport of the Senses) ==========
create table if not exists public.mnky_issues (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.mnky_collections(id) on delete cascade,
  issue_number int not null,
  title text not null,
  slug text unique not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  arc_summary text,
  cover_asset_url text,
  published_at timestamptz,
  created_at timestamptz default now()
);

comment on table public.mnky_issues is 'One manga issue per collection; status draft|published.';

create index mnky_issues_collection_id_idx on public.mnky_issues(collection_id);
create index mnky_issues_slug_idx on public.mnky_issues(slug);

alter table public.mnky_issues enable row level security;

create policy "mnky_issues_select_authenticated"
  on public.mnky_issues for select to authenticated using (true);
create policy "mnky_issues_select_anon_published"
  on public.mnky_issues for select to anon using (status = 'published');
create policy "mnky_issues_insert_admin"
  on public.mnky_issues for insert to authenticated with check (public.is_admin());
create policy "mnky_issues_update_admin"
  on public.mnky_issues for update to authenticated using (public.is_admin());
create policy "mnky_issues_delete_admin"
  on public.mnky_issues for delete to authenticated using (public.is_admin());

-- ========== 3. Chapters (one per fragrance in the issue) ==========
create table if not exists public.mnky_chapters (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.mnky_issues(id) on delete cascade,
  fragrance_name text not null,
  shopify_product_gid text not null,
  setting text,
  chapter_order int not null,
  created_at timestamptz default now()
);

comment on table public.mnky_chapters is 'Chapter per fragrance in an issue; chapter_order for TOC.';

create index mnky_chapters_issue_id_idx on public.mnky_chapters(issue_id);

alter table public.mnky_chapters enable row level security;

create policy "mnky_chapters_select_authenticated"
  on public.mnky_chapters for select to authenticated using (true);
create policy "mnky_chapters_select_anon"
  on public.mnky_chapters for select to anon using (
    exists (select 1 from public.mnky_issues i where i.id = issue_id and i.status = 'published')
  );
create policy "mnky_chapters_insert_admin"
  on public.mnky_chapters for insert to authenticated with check (public.is_admin());
create policy "mnky_chapters_update_admin"
  on public.mnky_chapters for update to authenticated using (public.is_admin());
create policy "mnky_chapters_delete_admin"
  on public.mnky_chapters for delete to authenticated using (public.is_admin());

-- ========== 4. Panels (storyboard panels per chapter) ==========
create table if not exists public.mnky_panels (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.mnky_chapters(id) on delete cascade,
  panel_number int not null,
  script_text text,
  asset_prompt text,
  asset_url text,
  created_at timestamptz default now(),
  unique (chapter_id, panel_number)
);

comment on table public.mnky_panels is 'Storyboard panel per chapter; panel_number orders panels.';

create index mnky_panels_chapter_id_idx on public.mnky_panels(chapter_id);

alter table public.mnky_panels enable row level security;

create policy "mnky_panels_select_authenticated"
  on public.mnky_panels for select to authenticated using (true);
create policy "mnky_panels_select_anon"
  on public.mnky_panels for select to anon using (
    exists (
      select 1 from public.mnky_chapters c
      join public.mnky_issues i on i.id = c.issue_id
      where c.id = chapter_id and i.status = 'published'
    )
  );
create policy "mnky_panels_insert_admin"
  on public.mnky_panels for insert to authenticated with check (public.is_admin());
create policy "mnky_panels_update_admin"
  on public.mnky_panels for update to authenticated using (public.is_admin());
create policy "mnky_panels_delete_admin"
  on public.mnky_panels for delete to authenticated using (public.is_admin());

-- ========== 5. Hotspots (shoppable artifact positions on a panel) ==========
create table if not exists public.mnky_hotspots (
  id uuid primary key default gen_random_uuid(),
  panel_id uuid not null references public.mnky_panels(id) on delete cascade,
  type text not null check (type in ('product', 'variant', 'collection', 'bundle')),
  shopify_gid text not null,
  x real not null check (x >= 0 and x <= 1),
  y real not null check (y >= 0 and y <= 1),
  label text,
  tooltip text
);

comment on table public.mnky_hotspots is 'Shoppable hotspot on a panel; x,y in 0..1.';

create index mnky_hotspots_panel_id_idx on public.mnky_hotspots(panel_id);

alter table public.mnky_hotspots enable row level security;

create policy "mnky_hotspots_select_authenticated"
  on public.mnky_hotspots for select to authenticated using (true);
create policy "mnky_hotspots_select_anon"
  on public.mnky_hotspots for select to anon using (
    exists (
      select 1 from public.mnky_panels p
      join public.mnky_chapters c on c.id = p.chapter_id
      join public.mnky_issues i on i.id = c.issue_id
      where p.id = panel_id and i.status = 'published'
    )
  );
create policy "mnky_hotspots_insert_admin"
  on public.mnky_hotspots for insert to authenticated with check (public.is_admin());
create policy "mnky_hotspots_update_admin"
  on public.mnky_hotspots for update to authenticated using (public.is_admin());
create policy "mnky_hotspots_delete_admin"
  on public.mnky_hotspots for delete to authenticated using (public.is_admin());

-- ========== 6. Read events (telemetry for XP; profile_id = reader) ==========
create table if not exists public.mnky_read_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  issue_id uuid references public.mnky_issues(id) on delete cascade,
  chapter_id uuid references public.mnky_chapters(id) on delete set null,
  session_id text not null,
  percent_read int not null check (percent_read >= 0 and percent_read <= 100),
  active_seconds int not null check (active_seconds >= 0),
  completed boolean not null default false,
  created_at timestamptz default now()
);

comment on table public.mnky_read_events is 'Read telemetry for manga; used for XP (e.g. completed when percent_read >= 80 and active_seconds >= 90).';

create index mnky_read_events_profile_issue_idx on public.mnky_read_events(profile_id, issue_id);
create index mnky_read_events_created_at_idx on public.mnky_read_events(created_at desc);

alter table public.mnky_read_events enable row level security;

create policy "mnky_read_events_select_own"
  on public.mnky_read_events for select to authenticated using (auth.uid() = profile_id);
create policy "mnky_read_events_insert_own"
  on public.mnky_read_events for insert to authenticated with check (auth.uid() = profile_id);
create policy "mnky_read_events_select_admin"
  on public.mnky_read_events for select to authenticated using (public.is_admin());

-- ========== 7. Download events (one per profile/issue/download_type for XP) ==========
create table if not exists public.mnky_download_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  issue_id uuid not null references public.mnky_issues(id) on delete cascade,
  download_type text not null check (download_type in ('pdf', 'wallpaper_pack', 'scent_cards')),
  created_at timestamptz default now(),
  unique (profile_id, issue_id, download_type)
);

comment on table public.mnky_download_events is 'Download telemetry; unique per profile/issue/type for XP anti-farm.';

create index mnky_download_events_profile_issue_idx on public.mnky_download_events(profile_id, issue_id);

alter table public.mnky_download_events enable row level security;

create policy "mnky_download_events_select_own"
  on public.mnky_download_events for select to authenticated using (auth.uid() = profile_id);
create policy "mnky_download_events_insert_own"
  on public.mnky_download_events for insert to authenticated with check (auth.uid() = profile_id);
create policy "mnky_download_events_select_admin"
  on public.mnky_download_events for select to authenticated using (public.is_admin());

-- ========== 8. Quiz attempts (for XP; score and passed) ==========
create table if not exists public.mnky_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  issue_id uuid not null references public.mnky_issues(id) on delete cascade,
  score int not null check (score >= 0 and score <= 100),
  passed boolean not null,
  created_at timestamptz default now()
);

comment on table public.mnky_quiz_attempts is 'Quiz attempt per issue; passed drives XP.';

create index mnky_quiz_attempts_profile_issue_idx on public.mnky_quiz_attempts(profile_id, issue_id);

alter table public.mnky_quiz_attempts enable row level security;

create policy "mnky_quiz_attempts_select_own"
  on public.mnky_quiz_attempts for select to authenticated using (auth.uid() = profile_id);
create policy "mnky_quiz_attempts_insert_own"
  on public.mnky_quiz_attempts for insert to authenticated with check (auth.uid() = profile_id);
create policy "mnky_quiz_attempts_select_admin"
  on public.mnky_quiz_attempts for select to authenticated using (public.is_admin());
