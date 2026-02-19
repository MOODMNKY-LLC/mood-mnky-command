-- Migration: Seed sample manga and quests for testing
-- Purpose: Populate testable sample data for Dojo, verse/issues, chapter reader, and quest flow.
-- Deletable via docs/SAMPLE-DATA-CLEANUP.sql
-- Slugs use "sample-" prefix for easy identification.

-- ========== 1. Collection ==========
INSERT INTO public.mnky_collections (name, slug)
SELECT 'World Traveler Series', 'sample-world-traveler'
WHERE NOT EXISTS (SELECT 1 FROM public.mnky_collections WHERE slug = 'sample-world-traveler');

-- ========== 2. Issues (2 published) ==========
INSERT INTO public.mnky_issues (
  collection_id, issue_number, title, slug, status, arc_summary, cover_asset_url, published_at
)
SELECT
  c.id, 1, 'Passport of the Senses', 'sample-passport-of-senses', 'published',
  'A sensory journey through exotic destinations. Each chapter reveals a fragrance tied to place and memory.',
  'https://placehold.co/400x600/1a1a2e/eee?text=Issue+01',
  now()
FROM public.mnky_collections c
WHERE c.slug = 'sample-world-traveler'
  AND NOT EXISTS (SELECT 1 FROM public.mnky_issues WHERE slug = 'sample-passport-of-senses');

INSERT INTO public.mnky_issues (
  collection_id, issue_number, title, slug, status, arc_summary, cover_asset_url, published_at
)
SELECT
  c.id, 2, 'Second Journey', 'sample-second-journey', 'published',
  'The sequel: new lands, new scents. Follow the traveler to hidden markets and mountain paths.',
  'https://placehold.co/400x600/16213e/eee?text=Issue+02',
  now()
FROM public.mnky_collections c
WHERE c.slug = 'sample-world-traveler'
  AND NOT EXISTS (SELECT 1 FROM public.mnky_issues WHERE slug = 'sample-second-journey');

-- ========== 3. Chapters (2–3 per issue) ==========
-- Issue 1 chapters
INSERT INTO public.mnky_chapters (issue_id, fragrance_name, shopify_product_gid, setting, chapter_order)
SELECT i.id, 'Midnight Oud', 'gid://shopify/Product/123456789', 'Istanbul bazaar at dusk', 1
FROM public.mnky_issues i WHERE i.slug = 'sample-passport-of-senses'
AND NOT EXISTS (
  SELECT 1 FROM public.mnky_chapters ch
  WHERE ch.issue_id = i.id AND ch.chapter_order = 1
);

INSERT INTO public.mnky_chapters (issue_id, fragrance_name, shopify_product_gid, setting, chapter_order)
SELECT i.id, 'Ocean Bloom', 'gid://shopify/Product/123456790', 'Santorini cliffside', 2
FROM public.mnky_issues i WHERE i.slug = 'sample-passport-of-senses'
AND NOT EXISTS (
  SELECT 1 FROM public.mnky_chapters ch
  WHERE ch.issue_id = i.id AND ch.chapter_order = 2
);

INSERT INTO public.mnky_chapters (issue_id, fragrance_name, shopify_product_gid, setting, chapter_order)
SELECT i.id, 'Desert Rose', 'gid://shopify/Product/123456791', 'Marrakech rooftop', 3
FROM public.mnky_issues i WHERE i.slug = 'sample-passport-of-senses'
AND NOT EXISTS (
  SELECT 1 FROM public.mnky_chapters ch
  WHERE ch.issue_id = i.id AND ch.chapter_order = 3
);

-- Issue 2 chapters
INSERT INTO public.mnky_chapters (issue_id, fragrance_name, shopify_product_gid, setting, chapter_order)
SELECT i.id, 'Alpine Mist', 'gid://shopify/Product/123456792', 'Swiss Alps meadow', 1
FROM public.mnky_issues i WHERE i.slug = 'sample-second-journey'
AND NOT EXISTS (
  SELECT 1 FROM public.mnky_chapters ch
  WHERE ch.issue_id = i.id AND ch.chapter_order = 1
);

INSERT INTO public.mnky_chapters (issue_id, fragrance_name, shopify_product_gid, setting, chapter_order)
SELECT i.id, 'Temple Incense', 'gid://shopify/Product/123456793', 'Kyoto temple garden', 2
FROM public.mnky_issues i WHERE i.slug = 'sample-second-journey'
AND NOT EXISTS (
  SELECT 1 FROM public.mnky_chapters ch
  WHERE ch.issue_id = i.id AND ch.chapter_order = 2
);

-- ========== 4. Panels (2–4 per chapter) ==========
-- Chapter 1 panels (Issue 1, chapter 1)
INSERT INTO public.mnky_panels (chapter_id, panel_number, script_text, asset_url)
SELECT ch.id, 1, 'The traveler arrives at the bazaar. Lanterns glow against the night sky.', 'https://placehold.co/800x1067/1a1a2e/666?text=Panel+1'
FROM public.mnky_chapters ch
JOIN public.mnky_issues i ON i.id = ch.issue_id
WHERE i.slug = 'sample-passport-of-senses' AND ch.chapter_order = 1
ON CONFLICT (chapter_id, panel_number) DO NOTHING;

INSERT INTO public.mnky_panels (chapter_id, panel_number, script_text, asset_url)
SELECT ch.id, 2, 'A vendor offers a small vial. "Midnight Oud," he says. "For the bold."', 'https://placehold.co/800x1067/16213e/666?text=Panel+2'
FROM public.mnky_chapters ch
JOIN public.mnky_issues i ON i.id = ch.issue_id
WHERE i.slug = 'sample-passport-of-senses' AND ch.chapter_order = 1
ON CONFLICT (chapter_id, panel_number) DO NOTHING;

INSERT INTO public.mnky_panels (chapter_id, panel_number, script_text, asset_url)
SELECT ch.id, 3, 'The scent lingers. The traveler knows: this moment will stay with them forever.', 'https://placehold.co/800x1067/0f3460/666?text=Panel+3'
FROM public.mnky_chapters ch
JOIN public.mnky_issues i ON i.id = ch.issue_id
WHERE i.slug = 'sample-passport-of-senses' AND ch.chapter_order = 1
ON CONFLICT (chapter_id, panel_number) DO NOTHING;

-- Chapter 2 panels (Issue 1, chapter 2)
INSERT INTO public.mnky_panels (chapter_id, panel_number, script_text, asset_url)
SELECT ch.id, 1, 'White cliffs. Blue water. The wind carries salt and wildflowers.', 'https://placehold.co/800x1067/1a1a2e/666?text=Ocean+1'
FROM public.mnky_chapters ch
JOIN public.mnky_issues i ON i.id = ch.issue_id
WHERE i.slug = 'sample-passport-of-senses' AND ch.chapter_order = 2
ON CONFLICT (chapter_id, panel_number) DO NOTHING;

INSERT INTO public.mnky_panels (chapter_id, panel_number, script_text, asset_url)
SELECT ch.id, 2, 'Ocean Bloom: fresh, luminous, alive. The traveler breathes it in.', 'https://placehold.co/800x1067/16213e/666?text=Ocean+2'
FROM public.mnky_chapters ch
JOIN public.mnky_issues i ON i.id = ch.issue_id
WHERE i.slug = 'sample-passport-of-senses' AND ch.chapter_order = 2
ON CONFLICT (chapter_id, panel_number) DO NOTHING;

-- Chapter 3 panels (Issue 1, chapter 3)
INSERT INTO public.mnky_panels (chapter_id, panel_number, script_text, asset_url)
SELECT ch.id, 1, 'Sunset over the medina. Rose petals scattered on the terrace.', 'https://placehold.co/800x1067/0f3460/666?text=Desert+1'
FROM public.mnky_chapters ch
JOIN public.mnky_issues i ON i.id = ch.issue_id
WHERE i.slug = 'sample-passport-of-senses' AND ch.chapter_order = 3
ON CONFLICT (chapter_id, panel_number) DO NOTHING;

INSERT INTO public.mnky_panels (chapter_id, panel_number, script_text, asset_url)
SELECT ch.id, 2, 'Desert Rose: warm, velvety, unforgettable.', 'https://placehold.co/800x1067/1a1a2e/666?text=Desert+2'
FROM public.mnky_chapters ch
JOIN public.mnky_issues i ON i.id = ch.issue_id
WHERE i.slug = 'sample-passport-of-senses' AND ch.chapter_order = 3
ON CONFLICT (chapter_id, panel_number) DO NOTHING;

-- Issue 2 chapter 1 panels
INSERT INTO public.mnky_panels (chapter_id, panel_number, script_text, asset_url)
SELECT ch.id, 1, 'Snow-capped peaks. Clean air. The traveler climbs higher.', 'https://placehold.co/800x1067/16213e/666?text=Alpine+1'
FROM public.mnky_chapters ch
JOIN public.mnky_issues i ON i.id = ch.issue_id
WHERE i.slug = 'sample-second-journey' AND ch.chapter_order = 1
ON CONFLICT (chapter_id, panel_number) DO NOTHING;

INSERT INTO public.mnky_panels (chapter_id, panel_number, script_text, asset_url)
SELECT ch.id, 2, 'Alpine Mist: crisp, green, endless.', 'https://placehold.co/800x1067/0f3460/666?text=Alpine+2'
FROM public.mnky_chapters ch
JOIN public.mnky_issues i ON i.id = ch.issue_id
WHERE i.slug = 'sample-second-journey' AND ch.chapter_order = 1
ON CONFLICT (chapter_id, panel_number) DO NOTHING;

-- ========== 5. Hotspots (1–2 on select panels) ==========
INSERT INTO public.mnky_hotspots (panel_id, type, shopify_gid, x, y, label, tooltip)
SELECT p.id, 'product', 'gid://shopify/Product/123456789', 0.5, 0.3, 'Midnight Oud', 'Discover this scent'
FROM public.mnky_panels p
JOIN public.mnky_chapters ch ON ch.id = p.chapter_id
JOIN public.mnky_issues i ON i.id = ch.issue_id
WHERE i.slug = 'sample-passport-of-senses' AND ch.chapter_order = 1 AND p.panel_number = 2
LIMIT 1;

INSERT INTO public.mnky_hotspots (panel_id, type, shopify_gid, x, y, label, tooltip)
SELECT p.id, 'product', 'gid://shopify/Product/123456790', 0.6, 0.5, 'Ocean Bloom', 'Explore this fragrance'
FROM public.mnky_panels p
JOIN public.mnky_chapters ch ON ch.id = p.chapter_id
JOIN public.mnky_issues i ON i.id = ch.issue_id
WHERE i.slug = 'sample-passport-of-senses' AND ch.chapter_order = 2 AND p.panel_number = 2
LIMIT 1;

-- ========== 6. Quests (4 with different rule types) ==========
-- Resolve issue_id for Passport of Senses (first issue)
DO $$
DECLARE
  v_issue_id uuid;
  v_quest_id uuid;
BEGIN
  SELECT id INTO v_issue_id FROM public.mnky_issues WHERE slug = 'sample-passport-of-senses' LIMIT 1;
  IF v_issue_id IS NULL THEN
    RETURN;
  END IF;

  -- Quest 1: Read Issue 01
  INSERT INTO public.quests (external_id, title, description, rule, xp_reward, active)
  VALUES (
    'sample-quest-read-issue',
    'Read Issue 01',
    'Complete your first manga read. Open Passport of the Senses and read through at least one chapter.',
    jsonb_build_object(
      'requirements', jsonb_build_array(jsonb_build_object('type', 'read_issue', 'issueId', v_issue_id)),
      'xpReward', 100
    ),
    100,
    true
  )
  ON CONFLICT (external_id) DO NOTHING;

  -- Quest 2: Pass Quiz
  INSERT INTO public.quests (external_id, title, description, rule, xp_reward, active)
  VALUES (
    'sample-quest-pass-quiz',
    'Pass the Quiz',
    'Test your knowledge of Passport of the Senses. Take the quiz and score 70% or higher.',
    jsonb_build_object(
      'requirements', jsonb_build_array(jsonb_build_object('type', 'mag_quiz', 'issueId', v_issue_id)),
      'xpReward', 75
    ),
    75,
    true
  )
  ON CONFLICT (external_id) DO NOTHING;

  -- Quest 3: First Purchase
  INSERT INTO public.quests (external_id, title, description, rule, xp_reward, active)
  VALUES (
    'sample-quest-first-purchase',
    'First Purchase',
    'Make your first purchase of $25 or more to unlock this quest.',
    jsonb_build_object(
      'requirements', jsonb_build_array(jsonb_build_object('type', 'purchase', 'minSubtotal', 25)),
      'xpReward', 50
    ),
    50,
    true
  )
  ON CONFLICT (external_id) DO NOTHING;

  -- Quest 4: Share UGC
  INSERT INTO public.quests (external_id, title, description, rule, xp_reward, active)
  VALUES (
    'sample-quest-ugc',
    'Share Your Moment',
    'Upload a photo or video from a fragrance moment. Once approved, you earn this reward.',
    jsonb_build_object(
      'requirements', jsonb_build_array(jsonb_build_object('type', 'ugc_approved')),
      'xpReward', 250
    ),
    250,
    true
  )
  ON CONFLICT (external_id) DO NOTHING;

END $$;

-- ========== 7. Rewards sample (optional, for testing) ==========
INSERT INTO public.rewards (type, payload, min_level, active)
SELECT 'discount_code', '{"code": "SAMPLE10", "percent": 10}'::jsonb, 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.rewards WHERE payload->>'code' = 'SAMPLE10');

INSERT INTO public.rewards (type, payload, min_level, active)
SELECT 'early_access', '{"label": "Early drop access"}'::jsonb, 3, true
WHERE NOT EXISTS (SELECT 1 FROM public.rewards WHERE type = 'early_access' AND (payload->>'label') = 'Early drop access');

-- ========== 8. XP and quest progress sample (optional, for demo - uses first profile) ==========
DO $$
DECLARE
  v_profile_id uuid;
  v_issue_id uuid;
  v_quest_id uuid;
BEGIN
  SELECT id INTO v_profile_id FROM public.profiles ORDER BY created_at ASC LIMIT 1;
  IF v_profile_id IS NULL THEN RETURN; END IF;

  SELECT id INTO v_issue_id FROM public.mnky_issues WHERE slug = 'sample-passport-of-senses' LIMIT 1;
  SELECT id INTO v_quest_id FROM public.quests WHERE external_id = 'sample-quest-read-issue' LIMIT 1;

  -- Award sample XP if none exists for this profile
  IF NOT EXISTS (SELECT 1 FROM public.xp_ledger WHERE profile_id = v_profile_id LIMIT 1) THEN
    PERFORM public.award_xp(v_profile_id, 'mag_read', v_issue_id::text, 50, 'Sample: read completed');
  END IF;

  -- Mark one quest completed for demo
  IF v_quest_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.quest_progress WHERE profile_id = v_profile_id AND quest_id = v_quest_id
  ) THEN
    INSERT INTO public.quest_progress (profile_id, quest_id, progress, completed_at)
    VALUES (v_profile_id, v_quest_id, '{"completed": true}'::jsonb, now())
    ON CONFLICT (profile_id, quest_id) DO NOTHING;
  END IF;

  -- Issue one reward claim for demo (if not already claimed)
  INSERT INTO public.reward_claims (profile_id, reward_id, status)
  SELECT v_profile_id, r.id, 'issued'
  FROM public.rewards r
  WHERE r.payload->>'code' = 'SAMPLE10'
    AND NOT EXISTS (
      SELECT 1 FROM public.reward_claims rc
      WHERE rc.profile_id = v_profile_id AND rc.reward_id = r.id
    )
  LIMIT 1;
EXCEPTION
  WHEN others THEN NULL;
END $$;
