# Main Section – Domain and Environment Configuration

This document describes how the mood-mnky-command app serves three sections from one deployment using host-based routing and which environment variables apply to each.

## Domain to section mapping

| Domain | Section | Path prefix | Purpose |
|--------|---------|-------------|---------|
| **mnky-command.moodmnky.com** | LABZ | `/` (root) | Admin dashboard, formulas, blending, platform, store, studio. |
| **mnky-verse.moodmnky.com** | MNKY VERSE | `/verse` | Community and member storefront, blog, Dojo entry. |
| **www.moodmnky.com** | Main | `/main` | Public marketing site (landing, about, contact, pricing). |
| **moodmnky.com** | Main | `/main` | Same as www; both rewrite to `/main`. |

The proxy (`apps/web/proxy.ts`) reads the `Host` header and rewrites requests so that:

- Requests to **mnky-verse.moodmnky.com** with path `/` or `/shop` become `/verse` or `/verse/shop` internally.
- Requests to **www.moodmnky.com** or **moodmnky.com** with path `/` or `/about` become `/main` or `/main/about` internally.

The browser URL does not change; only the internal route does.

## Environment variables

| Variable | Section | Example (production) | Use |
|----------|---------|----------------------|-----|
| `NEXT_PUBLIC_APP_URL` | LABZ | `https://mnky-command.moodmnky.com` | App base URL for theme, API, embeds. |
| `NEXT_PUBLIC_VERSE_APP_URL` | Verse | `https://mnky-verse.moodmnky.com` | Verse storefront base; auth callbacks when origin unknown. |
| `NEXT_PUBLIC_MAIN_APP_URL` | Main | `https://www.moodmnky.com` | Main site canonical URL; metadata, sitemap, CTAs. |

Set all three in Vercel (Production and Preview as needed). For local development, use `.env.local`; hosts file entries (see MAIN-SECTION-ROLLOUT.md) allow testing host-based routing.

## Vercel domain setup

1. In the Vercel project, add **www.moodmnky.com** and optionally **moodmnky.com** as custom domains.
2. Point DNS for those domains to Vercel (or use Vercel DNS).
3. The same deployment serves all three domains; no separate project or zone is required.

## Preview deployments

Vercel preview URLs (e.g. `project--branch.vercel.app`) do not match the production hostnames. The proxy does not rewrite for preview hosts, so preview deployments behave like the default domain (LABZ at root). To test Main or Verse on preview, use production-like domains locally via hosts file or test on staging/production.
