# Documentation Update Priorities

## Current Front-Facing Structure

**Total Pages**: ~149 pages across 7 main dropdowns

### ✅ Well-Documented Areas (No Immediate Updates Needed)

1. **MNKY VERSE** (10 pages) - Brand introduction and onboarding
2. **Brand & Company** (21 pages) - Comprehensive brand documentation
3. **Community & Engagement** (19 pages) - Platform and community features
4. **AI Agent Ecosystem** (33 pages) - Complete agent documentation
5. **API Hub - AI & Workflow APIs** (23 pages) - Well-documented APIs

### ⚠️ Needs Updates with Monorepo Context

## Priority 1: Applications Documentation (5 pages)

**Current Status**: Pages exist in navigation but need content verification and updates

### Pages to Update:

1. **applications/overview.mdx** ✅ Exists
   - **Needs**: Verify comparison table matches current apps
   - **Update**: Add `docs` and `web` apps if they should be documented
   - **Update**: Verify tech stack versions (Next.js 15, React 19)

2. **applications/mnky-verse.mdx** ✅ Exists
   - **Needs**: Update with latest features from README
   - **Update**: Verify Next.js version (says 14+, should be 15)
   - **Update**: Add latest architecture details
   - **Update**: Include recent sidebar enhancements

3. **applications/trvlr-sync.mdx** ✅ Exists
   - **Needs**: Update with latest features
   - **Update**: Include Supabase Edge Functions details
   - **Update**: Add manifest storage options (JSON vs SQLite)
   - **Update**: Include HTTPS setup instructions

4. **applications/shopify-app.mdx** ✅ Exists
   - **Needs**: Update with latest features
   - **Update**: Include Notion sync details
   - **Update**: Add Spotify integration if applicable
   - **Update**: Include custom blends workflow

5. **applications/mnky-agents-demo.mdx** ✅ Exists
   - **Needs**: Update with Docker Compose setup
   - **Update**: Include FastAPI details
   - **Update**: Add Python virtual environment setup

### Missing Applications (Consider Adding):

- **apps/docs** - Documentation site itself (Next.js app)
- **apps/web** - Web application (if it's a separate app)

## Priority 2: Packages Documentation (5 pages)

**Current Status**: Pages exist but may need enhancement

### Pages to Update:

1. **packages/overview.mdx** ✅ Exists
   - **Needs**: Verify all packages are listed
   - **Update**: Add usage examples from actual apps
   - **Update**: Include package dependency graph

2. **packages/ui.mdx** ✅ Exists
   - **Needs**: Verify component list matches actual components
   - **Update**: Add usage examples from apps
   - **Update**: Include theming documentation

3. **packages/supabase-client.mdx** ✅ Exists
   - **Needs**: Verify SSL configuration details
   - **Update**: Add real-world usage examples
   - **Update**: Include Edge Functions integration

4. **packages/eslint-config.mdx** ✅ Exists
   - **Needs**: Verify rules match current config
   - **Update**: Add configuration examples

5. **packages/typescript-config.mdx** ✅ Exists
   - **Needs**: Verify config matches current setup
   - **Update**: Add compiler options explanation

## Priority 3: Technology Stack Updates (4 pages)

**Current Status**: May have outdated version information

### Pages to Update:

1. **technology-stack/tech-stack-reference.mdx**
   - **Update**: Next.js 15 (not 14)
   - **Update**: React 19 (not 18)
   - **Update**: TypeScript 5.8+
   - **Update**: Latest Supabase features

2. **technology-stack/frontend-technologies.mdx**
   - **Update**: Latest Tailwind CSS version
   - **Update**: ShadCN UI components
   - **Update**: React Server Components usage

3. **technology-stack/supabase.mdx**
   - **Update**: Latest Supabase features
   - **Update**: Edge Functions patterns
   - **Update**: Storage (S3) integration

4. **technology-stack/ai-integration.mdx**
   - **Update**: Latest AI service integrations
   - **Update**: Vector search implementation
   - **Update**: Agent orchestration patterns

## Priority 4: Infrastructure Documentation (4 pages)

**Current Status**: Needs verification against current monorepo

### Pages to Update:

1. **technology-stack/mono-repo-structure.mdx**
   - **Update**: Current directory structure
   - **Update**: All apps (docs, web, mnky-verse, trvlr-sync, shopify-app, mnky-agents-demo)
   - **Update**: Workspace configuration (pnpm)
   - **Update**: Turborepo setup

2. **technology-stack/infra-overview.mdx**
   - **Update**: Current deployment targets
   - **Update**: Vercel configuration
   - **Update**: Supabase setup
   - **Update**: Docker services (n8n, agents-demo)

3. **technology-stack/deployment.mdx**
   - **Update**: Vercel deployment process
   - **Update**: Environment variable management
   - **Update**: CI/CD workflows
   - **Update**: Preview deployments

4. **technology-stack/security.mdx**
   - **Update**: Current security practices
   - **Update**: API key management
   - **Update**: RLS policies
   - **Update**: Authentication flows

## Priority 5: API Documentation Verification (19 pages)

**Current Status**: Need to verify pages exist and are current

### Pages to Verify:

#### Platform APIs (11 pages)
- api/core/index.mdx
- api/core/authentication.mdx
- api/core/endpoints.mdx
- api/core/webhooks.mdx
- api/core/examples.mdx
- api/e-commerce/index.mdx
- api/e-commerce/products.mdx
- api/e-commerce/cart.mdx
- api/e-commerce/checkout.mdx
- api/e-commerce/orders.mdx
- api/e-commerce/customer.mdx

#### Development Guidelines (8 pages)
- api/devops/environments/overview.mdx
- api/devops/environments/local-setup.mdx ✅ Exists
- api/devops/environments/production.mdx
- api/devops/authentication.mdx ✅ Exists
- api/devops/rate-limiting.mdx
- api/devops/best-practices.mdx
- api/devops/error-handling.mdx
- api/devops/monitoring.mdx

#### SDKs (2 pages)
- developer-resources/javascript-sdk.mdx
- developer-resources/ai-integration-sdk.mdx

## Quick Reference: What's Currently Front-Facing

### Navigation Structure (from docs.json)

```
📁 MNKY VERSE (10 pages)
  ├─ Welcome & Introduction
  ├─ Core Experiences
  └─ Get Started

📁 Brand & Company (21 pages)
  ├─ Brand Identity
  ├─ Company Foundation
  ├─ Brand Voice
  ├─ Brand Governance
  ├─ Product Philosophy
  └─ Product Catalog

📁 Community & Engagement (19 pages)
  ├─ Dojo Platform
  ├─ User Experience
  ├─ Community Features
  └─ Strategic Planning

📁 Development & DevOps (34 pages) ⚠️ NEEDS UPDATES
  ├─ Overview
  ├─ Applications (5 pages) ⚠️
  ├─ Packages (5 pages) ⚠️
  ├─ Technology Stack (4 pages) ⚠️
  ├─ Infrastructure (4 pages) ⚠️
  ├─ Development Guides (8 pages)
  ├─ Database & Backend (5 pages)
  └─ Integration & SDKs (2 pages)

📁 API Hub (25 pages)
  ├─ Introduction
  ├─ Platform APIs (11 pages) ⚠️ VERIFY
  ├─ AI & Workflow APIs (23 pages) ✅
  ├─ Integration APIs (6 pages) ✅
  ├─ API References ✅
  ├─ Development Guidelines (8 pages) ⚠️ VERIFY
  └─ SDKs (2 pages) ⚠️ VERIFY

📁 AI Agent Ecosystem (33 pages) ✅
  ├─ Agent Framework
  ├─ Agent Database System
  ├─ Individual Agents (15 pages)
  ├─ Agent Styling
  └─ User Guides

📁 Documentation (7 pages) ✅
  ├─ Documentation Guides
  └─ Core Concepts
```

## Recommended Update Sequence

### Week 1: Applications & Packages
1. ✅ Verify all application pages exist
2. ⚠️ Update application content with latest features
3. ⚠️ Enhance package documentation
4. ⚠️ Add missing apps if needed

### Week 2: Technology Stack
1. ⚠️ Update version numbers (Next.js 15, React 19)
2. ⚠️ Update architecture diagrams
3. ⚠️ Document latest patterns
4. ⚠️ Update infrastructure docs

### Week 3: API Documentation
1. ⚠️ Verify all API pages exist
2. ⚠️ Update API endpoints
3. ⚠️ Verify OpenAPI specs
4. ⚠️ Add missing examples

## Key Gaps Identified

1. **Monorepo Structure**: May not reflect current apps (docs, web)
2. **Version Information**: Mentions Next.js 14, should be 15
3. **Application Features**: May be missing recent enhancements
4. **Package Usage**: Need real-world examples from apps
5. **Infrastructure**: May not reflect current deployment setup

## Next Steps

1. Review each application page against README files
2. Update technology stack versions
3. Verify monorepo structure matches reality
4. Add missing documentation for new features
5. Enhance with code examples from actual apps

