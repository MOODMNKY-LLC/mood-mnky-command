-- Sample Data Cleanup Script
-- Removes sample manga, quests, rewards, and related data seeded for testing.
-- Run this when you want to remove all sample data. Safe to run multiple times.
--
-- Sample data uses these identifiers:
--   Collections: slug = 'sample-world-traveler'
--   Issues: slug IN ('sample-passport-of-senses', 'sample-second-journey')
--   Quests: external_id LIKE 'sample-quest-%'
--   Rewards: payload->>'code' = 'SAMPLE10' OR (type = 'early_access' AND payload->>'label' = 'Early drop access')

-- 1. Quest progress for sample quests
DELETE FROM public.quest_progress
WHERE quest_id IN (SELECT id FROM public.quests WHERE external_id LIKE 'sample-quest-%');

-- 2. Reward claims for sample rewards
DELETE FROM public.reward_claims
WHERE reward_id IN (
  SELECT id FROM public.rewards
  WHERE payload->>'code' = 'SAMPLE10'
     OR (type = 'early_access' AND payload->>'label' = 'Early drop access')
);

-- 3. Sample quests
DELETE FROM public.quests WHERE external_id LIKE 'sample-quest-%';

-- 4. Sample rewards
DELETE FROM public.rewards
WHERE payload->>'code' = 'SAMPLE10'
   OR (type = 'early_access' AND payload->>'label' = 'Early drop access');

-- 5. Hotspots (via panels in chapters in sample issues)
DELETE FROM public.mnky_hotspots
WHERE panel_id IN (
  SELECT p.id FROM public.mnky_panels p
  JOIN public.mnky_chapters ch ON ch.id = p.chapter_id
  JOIN public.mnky_issues i ON i.id = ch.issue_id
  WHERE i.slug IN ('sample-passport-of-senses', 'sample-second-journey')
);

-- 6. Panels (via chapters in sample issues)
DELETE FROM public.mnky_panels
WHERE chapter_id IN (
  SELECT ch.id FROM public.mnky_chapters ch
  JOIN public.mnky_issues i ON i.id = ch.issue_id
  WHERE i.slug IN ('sample-passport-of-senses', 'sample-second-journey')
);

-- 7. Chapters (sample issues)
DELETE FROM public.mnky_chapters
WHERE issue_id IN (
  SELECT id FROM public.mnky_issues
  WHERE slug IN ('sample-passport-of-senses', 'sample-second-journey')
);

-- 8. Sample issues
DELETE FROM public.mnky_issues
WHERE slug IN ('sample-passport-of-senses', 'sample-second-journey');

-- 9. Sample collection
DELETE FROM public.mnky_collections WHERE slug = 'sample-world-traveler';

-- Note: XP ledger entries and xp_state updated by sample data are NOT removed here,
-- as they may be intertwined with real user activity. If you need to reset XP for
-- the demo profile, do so manually via Verse Backoffice or direct SQL.
