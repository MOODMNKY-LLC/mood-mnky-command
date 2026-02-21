# Main Section – Navigation and Cross-Links

This document lists where the Main site (www.moodmnky.com / `/main`) is linked from the app and the Shopify theme so that visitors can move between the main marketing site, MNKY VERSE, and LABZ.

## In-app navigation

### Verse (storefront)

| Location | File | Change |
|----------|------|--------|
| Header (left) | [apps/web/components/verse/verse-header.tsx](apps/web/components/verse/verse-header.tsx) | "MOOD MNKY" link to `/main` added next to "MNKY VERSE" logo. |
| Footer | [apps/web/components/verse/verse-footer.tsx](apps/web/components/verse/verse-footer.tsx) | "MOOD MNKY" link to `/main` added next to "MNKY VERSE" in the footer. |

### Main site (internal)

The Main layout and pages link to `/verse`, `/auth/login`, `/main/about`, etc. CTAs point to Join MNKY VERSE (`/verse`), Fragrance Wheel (`/verse/fragrance-wheel`), Blending Guide (`/verse/blending-guide`), and Sign in (`/auth/login`). No code changes needed for internal Main links.

### LABZ (dashboard)

The dashboard sidebar and header do not currently include a "MOOD MNKY" or "Main site" link. To add one, add a nav item in [apps/web/components/app-sidebar.tsx](apps/web/components/app-sidebar.tsx) or the dashboard header linking to `NEXT_PUBLIC_MAIN_APP_URL` or `/main`.

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
