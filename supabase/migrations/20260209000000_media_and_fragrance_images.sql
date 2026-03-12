-- MOOD MNKY Lab: Media assets enhancements + fragrance image support
-- Purpose: Add category, generation metadata to media_assets; add image_url to fragrance_oils

-- ============================================================
-- 1. Extend media_assets
-- ============================================================

ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS source_model text,
  ADD COLUMN IF NOT EXISTS generation_prompt text;

COMMENT ON COLUMN public.media_assets.category IS 'e.g. fragrance-scene, product, mascot';
COMMENT ON COLUMN public.media_assets.source_model IS 'e.g. gpt-image-1.5';
COMMENT ON COLUMN public.media_assets.generation_prompt IS 'Prompt used for AI-generated images';

CREATE INDEX IF NOT EXISTS idx_media_assets_category ON public.media_assets(category) WHERE category IS NOT NULL;

-- ============================================================
-- 2. Extend fragrance_oils
-- ============================================================

ALTER TABLE public.fragrance_oils
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS image_source text;

COMMENT ON COLUMN public.fragrance_oils.image_url IS 'CDN URL for fragrance scene/image';
COMMENT ON COLUMN public.fragrance_oils.image_source IS 'notion | supabase | ai-generated';
