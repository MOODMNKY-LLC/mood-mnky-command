-- Migration: Seed config_xp_rules for MNKY VERSE gamification
-- Purpose: Default XP rules for mag_read, mag_quiz, mag_download, purchase.
-- Admin can update values via Verse Backoffice or direct DB edit.

insert into public.config_xp_rules (key, value, updated_at)
values
  (
    'mag_read',
    '{"xp": 50, "percent_min": 80, "active_seconds_min": 90}'::jsonb,
    now()
  ),
  (
    'mag_quiz',
    '{"xp": 75, "pass_threshold": 70}'::jsonb,
    now()
  ),
  (
    'mag_download',
    '{"xp": 25}'::jsonb,
    now()
  ),
  (
    'purchase',
    '{"tiers": [{"subtotal_min": 25, "xp": 50}, {"subtotal_min": 75, "xp": 150}]}'::jsonb,
    now()
  ),
  (
    'ugc_approved',
    '{"xp": 250}'::jsonb,
    now()
  )
on conflict (key) do update set
  value = excluded.value,
  updated_at = excluded.updated_at;
