# Documentation Reorganization TODO List

## Phase 1: Setup and Preparation ✅

- [x] Create the new directory structure
- [x] Create placeholder index files for main sections
- [x] Create docs.json.new file
- [x] Create content mapping spreadsheet (CONTENT-MIGRATION-TEMPLATE.csv)
- [x] Create migration guide (MIGRATION-GUIDE.md)
- [x] Set up sample authentication API documentation

## Phase 2: Content Migration

### API Documentation

- [ ] Migrate all API reference content to new structure
- [ ] Update API examples with correct paths
- [ ] Organize endpoints by functional area
- [ ] Update all internal references

### Platform Documentation

- [x] Migrate Dojo platform documentation (2026-02-20: dojo-overview, dojo-features aligned with codebase)
- [x] MNKY LABZ documentation (2026-02-20: created labz-overview.mdx)
- [x] Shopify Store documentation (2026-02-20: shopify-store.mdx — theme, extensions, App Proxy, Customer Account)
- [ ] Migrate e-commerce integration documentation
- [ ] Migrate personalization system documentation
- [ ] Migrate token economy documentation
- [x] Community/Discord documentation (2026-02-20: community-features.mdx rewritten with Discord API, events, webhooks, platform dashboard)

### Brand Documentation

- [x] Reorganize MNKY VERSE / experience content (2026-02-20: mood-experience → MNKY VERSE portal)
- [x] Update cross-references between brand sections (2026-02-20: introduction, ecosystem-blueprint)
- [ ] Ensure all brand assets are properly linked

### Agent Documentation

- [ ] Keep existing agent content structure
- [ ] Create infrastructure section with shared capabilities
- [ ] Update agent API references

### Developer Resources

- [ ] Migrate to guides and reference structure
- [ ] Organize by development task
- [ ] Update code examples

### Tutorials

- [ ] Create step-by-step tutorials based on common tasks
- [ ] Ensure each tutorial has prerequisites, steps, and verification
- [ ] Link tutorials from relevant guide sections

## Phase 3: Navigation Update

- [x] Update docs.json for MNKY VERSE, Dojo, LABZ (2026-02-20: Core Experiences, Applications, Database & Backend)
- [ ] Finalize the docs.json.new file (if separate migration file exists)
- [ ] Test navigation with staging environment
- [ ] Make adjustments based on testing feedback
- [ ] Back up original docs.json
- [ ] Replace docs.json with new version

## Phase 4: Cleanup

- [ ] Test all links for proper functioning
- [ ] Verify all redirects are working
- [ ] Remove temporary files and notes
- [ ] Archive old directory structure
- [x] Final documentation review (2026-02-20: Mintlify overhaul refinements applied)

## Additional Tasks

- [ ] Update content index for search
- [ ] Improve SEO metadata
- [ ] Optimize images and assets
- [ ] Add analytics tracking for documentation usage