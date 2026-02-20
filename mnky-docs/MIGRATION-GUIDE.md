# Documentation Migration Guide

This guide outlines the steps for migrating content from the old documentation structure to the new structure.

## Directory Structure Changes

We've reorganized the documentation structure to better align with the PRD and improve organization:

### New Directory Structure

```
docs/
├── api/                            # API Reference (renamed from api-reference)
│   ├── core/                       # Core API documentation
│   ├── e-commerce/                 # E-commerce API integration
│   ├── agents/                     # Agent API documentation
│   └── reference/                  # API reference & specifications
│
├── guides/                         # User and Developer Guides
│   ├── getting-started/            # Onboarding guides
│   ├── development/                # Development guides
│   ├── user/                       # User guides
│   └── admin/                      # Admin guides
│
├── agents/                         # Agent Documentation (kept as is)
│   ├── mood-mnky/                  # MOOD MNKY agent
│   ├── code-mnky/                  # CODE MNKY agent
│   ├── sage-mnky/                  # SAGE MNKY agent
│   └── infrastructure/             # Agent infrastructure docs (new)
│
├── platform/                       # Platform Documentation
│   ├── dojo/                       # Dojo platform docs
│   ├── e-commerce/                 # E-commerce integration
│   ├── personalization/            # Personalization systems
│   └── token-economy/              # Token economy docs
│
├── reference/                      # Technical Reference
│   ├── architecture/               # System architecture
│   ├── data-models/                # Data models and schemas
│   ├── integration/                # Integration points
│   └── security/                   # Security reference
│
├── tutorials/                      # Step-by-step Tutorials
│   ├── development/                # Development tutorials
│   ├── customization/              # Customization tutorials
│   └── integration/                # Integration tutorials
│
├── brand/                          # Brand Documentation (from brand-overview)
│   ├── vision/                     # Brand vision and mission
│   ├── design/                     # Design guidelines
│   ├── products/                   # Product catalog
│   └── strategy/                   # Strategy documents
│
└── internal/                       # Internal Documentation
    ├── processes/                  # Internal processes
    ├── development/                # Development practices
    └── infrastructure/             # Infrastructure documentation
```

## Migration Plan

### Phase 1: Setup and Preparation

1. ✅ Create the new directory structure
2. ✅ Create placeholder index files for main sections
3. Update the docs.json.new file (ready for implementation)
4. Create a content mapping spreadsheet (see below for template)

### Phase 2: Content Migration

For each section, follow these steps:

1. Copy content from the old structure to the new structure
2. Update internal links to point to new locations
3. Update frontmatter metadata if needed
4. Test the documentation locally to ensure everything works correctly

### Phase 3: Navigation Update

1. Review and finalize the docs.json.new file
2. Replace the existing docs.json with the new version
3. Test the navigation to ensure all links work correctly

### Phase 4: Cleanup

1. After confirming all content is properly migrated, archive or remove old directories
2. Update any remaining references to old paths
3. Perform a final verification of all links and navigation

## Content Mapping Template

| Old Path | New Path | Status | Notes |
|----------|----------|--------|-------|
| brand-overview/mission-vision.mdx | brand/vision/mission-vision.mdx | Pending | Update links to design docs |
| technology-stack/overview.mdx | reference/architecture/overview.mdx | Pending | - |
| api-reference/introduction.mdx | api/introduction.mdx | Completed | - |
| ... | ... | ... | ... |

## Implementation Notes

- Create redirects for old URLs to prevent broken links
- Update any hardcoded links in external documents or code
- Ensure all images and assets are properly migrated and linked
- Test on both light and dark themes

## Testing Checklist

- [ ] All navigation tabs work correctly
- [ ] All internal links function properly
- [ ] All images and assets display correctly
- [ ] Search functionality works with new structure
- [ ] Both light and dark themes display properly
- [ ] Mobile responsiveness is maintained

## Timeline

- **Phase 1**: [Date]
- **Phase 2**: [Date] - [Date] (section by section)
- **Phase 3**: [Date]
- **Phase 4**: [Date]
- **Go Live**: [Date]