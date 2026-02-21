# Main Section and Multi-Domain Routing – Execution Report

This report summarizes what was implemented for the Main section and multi-domain routing, the research and decisions behind it, testing guidance, limitations, and the checklist of manual steps to complete rollout.

---

## 1. What Was Done

### 1.1 Deep research

- **Deliverable:** [docs/MAIN-SECTION-RESEARCH-REPORT.md](MAIN-SECTION-RESEARCH-REPORT.md)
- Research covered: host-based rewriting in Next.js 16 proxy, multi-domain Supabase and Shopify Customer Account API configuration, section-specific metadata and PWA, and public marketing site design patterns. Findings were used to design the rewrite order (rewrite first, then session with effective pathname), public `/main` access, and documentation for redirect URLs and rollout.

### 1.2 Route group and pages

| Path | Purpose |
|------|---------|
| `apps/web/app/(main)/main/layout.tsx` | Main layout: metadata (title, description, Open Graph, canonical via `NEXT_PUBLIC_MAIN_APP_URL`), `.main-site` wrapper. No auth. |
| `apps/web/app/(main)/main/main-site.css` | Scoped tokens `--main-page-width`, `--main-spacing-sections`, `.main-container`. |
| `apps/web/app/(main)/main/page.tsx` | Landing: hero, CTAs (Join MNKY VERSE, Fragrance Wheel, Sign in), two cards (VERSE, Blending Lab), MainFooter. |
| `apps/web/app/(main)/main/main-footer.tsx` | Shared footer: MOOD MNKY, About, VERSE, Blog, Docs. |
| `apps/web/app/(main)/main/about/page.tsx` | About page with metadata and CTA to Verse. |
| `apps/web/app/(main)/main/contact/page.tsx` | Contact page with metadata and CTA. |
| `apps/web/app/(main)/main/pricing/page.tsx` | Pricing page with metadata and CTA. |
| `apps/web/app/(main)/main/loading.tsx` | Loading spinner for Main segment. |
| `apps/web/app/(main)/main/error.tsx` | Client error boundary with Try again and Back to home. |

All Main pages are server components except `error.tsx` (client). They use root design tokens, shadcn (Button, Card), and BlurFade.

### 1.3 Proxy and middleware

| File | Change |
|------|--------|
| `apps/web/proxy.ts` | Host-based rewrite: `mnky-verse.moodmnky.com` → `/verse`, `www.moodmnky.com` / `moodmnky.com` → `/main`. Computes `effectivePathname`, calls `updateSession(request, { effectivePathname })`, then if rewrite needed returns `NextResponse.rewrite()` with session cookies copied. |
| `apps/web/lib/supabase/middleware.ts` | New optional second argument `UpdateSessionOptions { effectivePathname?: string }`. Path-based checks (public routes, verse/dojo/admin) use `effectivePathname ?? request.nextUrl.pathname`. Added `isMainRoute = pathname.startsWith("/main")` so all `/main` is public. |

### 1.4 Config and env

| File | Change |
|------|--------|
| `apps/web/next.config.mjs` | Headers: added `/main/:path*` with same CSP `frame-ancestors` as Verse. PWA: added `{ url: "/main", revision }` to `additionalPrecacheEntries`. |
| `.env.example` | Added `NEXT_PUBLIC_MAIN_APP_URL` with comment (Prod: https://www.moodmnky.com). |
| `docs/VERCEL-ENV-SYNC.md` | Added `NEXT_PUBLIC_MAIN_APP_URL` to App checklist. |
| `docs/SHOPIFY-APP-URL-CONFIG.md` | Added Main URL to production domains list and reference to MAIN-SECTION-DOMAINS. |

### 1.5 Auth and redirect docs

| File | Purpose |
|------|---------|
| `docs/MAIN-SECTION-SUPABASE-AUTH.md` | New: Supabase Site URL and Redirect URLs checklist for www.moodmnky.com. |
| `docs/HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md` | Updated: added www.moodmnky.com to Callback URI(s), JavaScript origin(s), and Logout URI(s). |
| `docs/VERCEL-ENV-SYNC.md` | Updated: Customer Account API table includes www callback and origin. |

### 1.6 Navigation

| File | Change |
|------|--------|
| `apps/web/components/verse/verse-header.tsx` | "MOOD MNKY" link to `/main` added next to "MNKY VERSE" logo. |
| `apps/web/components/verse/verse-footer.tsx` | "MOOD MNKY" link to `/main` added next to "MNKY VERSE" in footer. |
| `Shopify/theme/sections/footer-group.json` | MOOD MNKY block subtext: link to https://www.moodmnky.com. Community block: MNKY VERSE blog link to mnky-verse, added "visit www.moodmnky.com" link. |
| `docs/MAIN-SECTION-NAVIGATION.md` | New: lists all in-app and theme navigation changes. |

### 1.7 New docs

| Doc | Purpose |
|-----|---------|
| `docs/MAIN-SECTION-RESEARCH-REPORT.md` | Deep research narrative and practical implications. |
| `docs/MAIN-SECTION-DOMAINS.md` | Domain → section mapping, env vars, Vercel and preview notes. |
| `docs/MAIN-SECTION-SUPABASE-AUTH.md` | Supabase redirect URL checklist for Main. |
| `docs/MAIN-SECTION-NAVIGATION.md` | In-app and Shopify theme nav updates. |
| `docs/MAIN-SECTION-ROLLOUT.md` | Local testing (hosts file), preview, SEO/sitemap, rollout checklist. |
| `docs/DESIGN-SYSTEM.md` | Main section: architecture diagram, Main (main-site.css), fonts table, references. |
| `docs/MAIN-SECTION-EXECUTION-REPORT.md` | This report. |

---

## 2. Research Summary and Decisions

- **Rewrite then session:** The proxy rewrites by host first, then runs `updateSession` with `effectivePathname` so auth sees `/main` or `/verse` and correctly allows public Main and Verse public paths.
- **Public Main:** All paths under `/main` are public (no login required). Implemented via `pathname.startsWith("/main")` in middleware.
- **Supabase/Shopify:** Redirect URLs and JavaScript origins for www.moodmnky.com are documented; actual values are configured in Supabase Dashboard and Shopify Customer Account API (Hydrogen) settings.
- **Main design:** Main uses root tokens and Inter; no Verse fonts or verse-storefront.css. Optional scoped tokens in main-site.css (`--main-page-width`, `--main-spacing-sections`) for layout only.
- **Preview:** Vercel preview URLs do not trigger host rewrite; preview behaves as default domain (LABZ). Local testing uses hosts file.

---

## 3. Testing Performed

- **Lint:** No linter errors reported for modified TypeScript/TSX files.
- **Build:** Not run in this session; recommended before merge: `pnpm build` from repo root.
- **Manual testing:** Follow [docs/MAIN-SECTION-ROLLOUT.md](MAIN-SECTION-ROLLOUT.md) for hosts file setup and verification of mnky-command, mnky-verse, and www.moodmnky.com.

---

## 4. Known Limitations and Follow-ups

- **Preview deployments:** No host-based rewrite on *.vercel.app; to test Main/Verse on a branch, use production-like domains or local hosts file.
- **Sitemap:** App has no sitemap yet; if one is added, include `/main` and use `NEXT_PUBLIC_MAIN_APP_URL` for canonical Main URLs.
- **Cookie scope:** Cross-subdomain session (e.g. login on www and reuse on verse) was not validated; Main is intended as public with CTAs to Verse/Labz for sign-in.
- **LABZ nav:** Dashboard sidebar does not yet link to Main; optional add in app-sidebar or header (see MAIN-SECTION-NAVIGATION.md).

---

## 5. Checklist of Manual Steps

- [ ] **Vercel:** Add www.moodmnky.com (and optionally moodmnky.com) as custom domains to the project. Set `NEXT_PUBLIC_MAIN_APP_URL=https://www.moodmnky.com` for Production (and Preview if desired).
- [ ] **Supabase Dashboard:** Authentication → URL Configuration → add `https://www.moodmnky.com` and `https://www.moodmnky.com/**` to Redirect URLs (see MAIN-SECTION-SUPABASE-AUTH.md).
- [ ] **Shopify:** Hydrogen → Customer Account API → Application setup: add Callback URI `https://www.moodmnky.com/api/customer-account-api/callback`, JavaScript origin `www.moodmnky.com`, and Logout URIs for www (see HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md).
- [ ] **DNS:** Point www.moodmnky.com to Vercel; verify SSL.
- [ ] **Theme:** If footer was edited in Theme Editor after the repo update, re-add the Main site link in the footer block or push theme from repo.
- [ ] **Smoke test:** Open https://www.moodmnky.com, https://mnky-verse.moodmnky.com, https://mnky-command.moodmnky.com and confirm correct section and auth behavior.
