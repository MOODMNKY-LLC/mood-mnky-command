# Documentation Audit

## Overview
This document provides an audit of the current documentation site structure, identifying missing files and inconsistencies. Created to ensure the documentation defined in docs.json matches the actual files available.

## Audit Date: 2026-02-20 (Mintlify Docs Overhaul)

## Status

✅ **Documentation overhaul completed.** Core experiences (MNKY VERSE, The Dojo, MNKY LABZ) now align with the mood-mnky-command codebase.

### Mintlify Docs Overhaul (2026-02-20)

- ✅ Replaced "THE EXPERIENCE" with **MNKY VERSE** (web experiential portal) in mood-experience.mdx
- ✅ Rewrote applications/mnky-verse.mdx to reflect apps/web structure, Hydrogen React, Supabase
- ✅ Updated dojo-overview.mdx and dojo-features.mdx to match actual Dojo (XP, quests, Blending Lab, MNKY CHAT)
- ✅ Created platform-services/labz-overview.mdx (MNKY LABZ dashboard, CODE MNKY, routes, APIs)
- ✅ Updated tech-foundation.mdx: replaced DevOps framing with LABZ; stack = Next.js, Supabase, Vercel
- ✅ Reframed introduction.mdx pillars: MNKY VERSE (portal), The Dojo (private hub), MNKY LABZ (backstage)
- ✅ Updated applications/overview.mdx: single app with three experiences
- ✅ Updated mono-repo-structure.mdx: apps/web, Shopify/theme, extensions/, supabase/
- ✅ Updated ecosystem-blueprint.mdx: current implementation diagram and digital platform architecture
- ✅ Archived experience-pillar.mdx with redirect to mood-experience
- ✅ Updated docs.json: added labz-overview to Core Experiences, Applications, Database & Backend
- ✅ Fixed mnky-verse.mdx env vars: `NEXT_PUBLIC_STORE_DOMAIN`, `NEXT_PUBLIC_STOREFRONT_API_TOKEN` (per SHOPIFY-ENV-REFERENCE.md)
- ✅ Refined mono-repo-structure.mdx: removed data/schemas, infra/supabase; corrected workspace config; fixed Supabase setup commands
- ✅ Refined ecosystem-blueprint.mdx Development Infrastructure: monorepo structure, DevOps (Vercel, GitHub Actions, Supabase)

---

## Previous Audit (2025-04-05)

Previous issues:
- Missing files have been addressed by creating placeholder files for all previously missing documentation.
- All placeholders clearly indicate they are under construction and outline the planned content.

## Recent Updates (2025-04-05)

### SSL Configuration and Additional Documentation
- ✅ Created `docs/developer-resources/supabase-ssl-config.mdx` for SSL configuration guide
- ✅ Created `docs/developer-resources/data-modeling.mdx` for Supabase data modeling patterns
- ✅ Created `docs/developer-resources/migration-patterns.mdx` for database migration guidelines
- ✅ Set up SSL certificate structure in `infra/certs/supabase/`
- ✅ Updated Supabase client to support SSL configurations
- ✅ Added utility script for environment variable management

### Documentation Updates for Supabase Restructuring
- ✅ Updated `docs/technology-stack/mono-repo-structure.mdx` with new Supabase structure
- ✅ Updated `docs/technology-stack/supabase.mdx` with Supabase integration details
- ✅ Updated `docs/developer-resources/introduction.mdx` with revised repository structure
- ✅ Created `docs/developer-resources/supabase-local-development.mdx` as a new guide
- ✅ Added README files with changelogs:
  - Added `data/README.md` explaining data models and schemas
  - Added `packages/supabase-client/README.md` documenting the shared client
  - Updated `infra/supabase/README.md` with a changelog section
  - Added `CHANGELOG.md` to the root directory

## Navigation Structure

The following pages are defined in docs.json and now all exist (at least as placeholders):

### Introduction Section
- ✅ docs/index.md - Exists
- ✅ docs/vision.md - Exists
- ✅ docs/architecture.md - Exists
- ✅ docs/standards.md - Exists

### AI Agents Section
- ✅ docs/agents/index.mdx - Exists
- ✅ docs/agents/mood-mnky/overview.md - Exists
- ✅ docs/agents/code-mnky/overview.md - Exists
- ✅ docs/agents/sage-mnky/overview.md - Exists
- ✅ docs/agents/infrastructure/knowledge-base.mdx - Exists
- ✅ docs/agents/infrastructure/orchestration.mdx - Exists
- ✅ docs/agents/infrastructure/user-profiling.mdx - Exists
- ✅ docs/agents/infrastructure/memory-system.mdx - Exists
- ✅ docs/agents/developer-guide.mdx - Exists (placeholder)
- ✅ docs/agents/content-guide.mdx - Exists (placeholder)
- ✅ docs/agents/user-guide.mdx - Exists (placeholder)

### Platform Services Section
- ✅ docs/platform-services/index.md - Exists
- ✅ docs/platform-services/ai-agents.mdx - Exists (placeholder)
- ✅ docs/platform-services/memory-systems.mdx - Exists (placeholder)
- ✅ docs/platform-services/integration-points.mdx - Exists (placeholder)
- ✅ docs/platform-services/ux-guidelines.mdx - Exists (placeholder)

### Developer Resources Section
- ✅ docs/developer-resources/introduction.mdx - Exists and Updated
- ✅ docs/developer-resources/supabase-api.mdx - Exists
- ✅ docs/developer-resources/storage.mdx - Exists
- ✅ docs/developer-resources/supabase-local-development.mdx - New

### Technology Stack Section
- ✅ docs/technology-stack/mono-repo-structure.mdx - Exists and Updated
- ✅ docs/technology-stack/supabase.mdx - Exists and Updated
- ✅ docs/technology-stack/nextjs.mdx - Exists

### Guides Section
- ✅ docs/guides/index.md - Exists
- ✅ docs/guides/migration-guide.mdx - Exists (placeholder)

## Recommendations

### Next Steps
1. **Develop Full Content**: Replace placeholders with comprehensive documentation
2. **Create Visual Assets**: Develop diagrams and illustrations for key concepts
3. **Add Code Examples**: Include implementation examples in developer-oriented pages
4. **Improve Interlinking**: Ensure all pages properly reference related documentation
5. **Add API References**: Develop detailed API documentation for integration points
6. **Documentation Maintenance**: Create a process for keeping documentation up-to-date with code changes

### Content Enhancement Priorities
1. Complete AI Agents documentation with detailed implementation guidelines
2. Develop comprehensive API references for all integration points
3. Create visual assets to illustrate complex concepts
4. Add interactive elements to improve documentation usability
5. Expand on implementation examples and case studies

### Documentation Process Improvements
1. **Automated Documentation Checks**: Explore tools to validate documentation links and references
2. **PR Documentation Requirements**: Update PR template to include documentation requirements
3. **Documentation Working Group**: Establish a regular review cycle for documentation quality
4. **User Feedback Mechanism**: Implement a way for users to report documentation issues
5. **Style Guide**: Develop comprehensive documentation style guide for consistency