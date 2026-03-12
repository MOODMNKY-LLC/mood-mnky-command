-- =============================================================================
-- App Factory: Platforms source_path → infra by framework (Next.js)
-- Purpose: Source Platforms template from infra/templates/nextjs/platforms so
--          devs see app/service framework at a glance. Replaces temp/platforms.
-- =============================================================================

update public.template_registry
set source_path = 'infra/templates/nextjs/platforms',
    updated_at = now()
where template_key = 'platforms';
