-- Migration: MNKY BOX editorial columns on mnky_issues
-- Purpose: One issue can drive both the manga reader and the MNKY BOX editorial view.
-- Optional accent/lore/hero allow per-issue box theming without a separate drops table.

alter table public.mnky_issues
  add column if not exists accent_primary text,
  add column if not exists accent_secondary text,
  add column if not exists hero_asset_url text,
  add column if not exists lore_override text;

comment on column public.mnky_issues.accent_primary is 'Hex color for MNKY BOX accent (e.g. #B7F0FF).';
comment on column public.mnky_issues.accent_secondary is 'Hex color for MNKY BOX secondary accent (e.g. #F6D1A7).';
comment on column public.mnky_issues.hero_asset_url is 'Optional hero image URL for MNKY BOX view; falls back to cover_asset_url if null.';
comment on column public.mnky_issues.lore_override is 'Optional lore copy for MNKY BOX; falls back to arc_summary if null.';
