# Main Section – Navigation and Cross-Links

**Main** (www.moodmnky.com / `/main`) is the **mono app home page**: the brand’s public landing and primary entry point. It is linked from sidebars, headers, auth, and the Verse dock so users can reach the brand home from every section.

This document lists where Main is linked from the app and the Shopify theme.

## In-app navigation

### Verse (storefront)

| Location | File | Change |
|----------|------|--------|
| Header (left) | [apps/web/components/verse/verse-header.tsx](apps/web/components/verse/verse-header.tsx) | "MOOD MNKY" link to `/main` next to "MNKY VERSE" logo. |
| Footer | [apps/web/components/verse/verse-footer.tsx](apps/web/components/verse/verse-footer.tsx) | "MOOD MNKY" link to `/main` next to "MNKY VERSE" in the footer. |
| Verse dock (non-admin) | [apps/web/components/verse/verse-admin-dock.tsx](apps/web/components/verse/verse-admin-dock.tsx) | "Home (MOOD MNKY)" icon links to `/main`; "VERSE" icon links to `/verse`. |
| Verse dock (admin) | [apps/web/components/verse/verse-admin-dock.tsx](apps/web/components/verse/verse-admin-dock.tsx) | "Home (MOOD MNKY)" icon links to `/main`; LABZ icon links to `/`. |

### Main site (internal)

The Main layout and pages link to `/verse`, `/auth/login`, `/main/about`, etc. CTAs point to Join MNKY VERSE (`/verse`), Fragrance Wheel (`/verse/fragrance-wheel`), Blending Guide (`/verse/blending-guide`), and Sign in (`/auth/login`).

### LABZ (dashboard)

| Location | File | Change |
|----------|------|--------|
| Context switcher | [apps/web/lib/labz-sidebar-context.ts](apps/web/lib/labz-sidebar-context.ts) | "Home (MOOD MNKY)" in `labzEcosystemLinks` → `/main`. |
| Dashboard header | [apps/web/app/(dashboard)/layout.tsx](apps/web/app/(dashboard)/layout.tsx) | "Home" link to `/main` before "MOOD MNKY LABZ". |
| Sidebar footer | [apps/web/components/app-sidebar.tsx](apps/web/components/app-sidebar.tsx) | "Home" link to `/main` above Sign out. |

### Dojo

| Location | File | Change |
|----------|------|--------|
| Sidebar nav groups | [apps/web/lib/dojo-sidebar-config.tsx](apps/web/lib/dojo-sidebar-config.tsx) | "MOOD MNKY (Home)" → `/main` in `dojoNavGroups` (all contexts). |
| Team switcher community links | [apps/web/lib/dojo-sidebar-config.tsx](apps/web/lib/dojo-sidebar-config.tsx) | "MOOD MNKY (Home)" → `/main` in `dojoCommunityLinks`. |

### Auth

| Location | File | Change |
|----------|------|--------|
| Auth layout | [apps/web/components/auth/auth-page-layout.tsx](apps/web/components/auth/auth-page-layout.tsx) | "Home" link (top-left) to `/main` on all auth pages. |

## Shopify theme

| Location | File | Change |
|----------|------|--------|
| Footer – MOOD MNKY block | [Shopify/theme/sections/footer-group.json](Shopify/theme/sections/footer-group.json) | Subtext for "MOOD MNKY" block now includes a link to `https://www.moodmnky.com`. |
| Footer – Community block | [Shopify/theme/sections/footer-group.json](Shopify/theme/sections/footer-group.json) | "MNKY VERSE blog" link set to `https://mnky-verse.moodmnky.com/verse/blog`; added "visit www.moodmnky.com" link. |

**Theme editor:** If the theme customizer overwrites `footer-group.json`, re-add the Main site link in the footer block subtext (Theme → Customize → Footer → MOOD MNKY block: add link to https://www.moodmnky.com).

## Menu / config (Shopify)

Navigation menus are managed in Shopify Admin (Online Store → Navigation). To add "MOOD MNKY" or "Home" pointing to the main site:

1. Edit the menu (e.g. Main menu or Footer).
2. Add a link: URL `https://www.moodmnky.com`, title "MOOD MNKY" or "Home".
3. Save.

This is not stored in the repo; document in your runbook or theme setup doc.
