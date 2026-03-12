# Main Section – Domain and Environment Configuration

This document describes how the mood-mnky-command app uses a **single canonical domain** (www.moodmnky.com) with path-based routing. Legacy domains redirect to www with path mapping.

## Single canonical domain

| Domain / path | Section | Purpose |
|---------------|---------|---------|
| **www.moodmnky.com** | Canonical host | All app traffic. Root `/` rewrites to `/main`. |
| **www.moodmnky.com/main** | Main | Public marketing site (landing, about, contact, pricing). |
| **www.moodmnky.com/dojo**, **www.moodmnky.com/verse** | MNKY DOJO | Storefront and member hub; `/verse` redirects to `/dojo`. |
| **www.moodmnky.com/platform**, **www.moodmnky.com/labz** | MNKY LABZ | Back office (dashboard, platform, store, studio). `/labz` redirects to `/platform`. |

## Legacy domain redirects (middleware)

The proxy ([apps/web/proxy.ts](apps/web/proxy.ts)) redirects non-canonical hosts to www with path mapping:

- **mnky-command.moodmnky.com** → `https://www.moodmnky.com/platform` (root) or same path.
- **mnky-verse.moodmnky.com** → `https://www.moodmnky.com/dojo` (root) or same path.
- **moodmnky.com** (apex) → `https://www.moodmnky.com` (same path).

Redirects are 301 so bookmarks and shared links land on the correct section.

## Environment variables

| Variable | Example (production) | Use |
|----------|----------------------|-----|
| `NEXT_PUBLIC_APP_URL` | `https://www.moodmnky.com` | App base URL for theme, API, embeds, and auth. |
| `NEXT_PUBLIC_VERSE_APP_URL` | `https://www.moodmnky.com` | Can match APP_URL; auth callbacks when origin unknown. |
| `NEXT_PUBLIC_MAIN_APP_URL` | `https://www.moodmnky.com` | Main site canonical URL; metadata, sitemap, CTAs. |

Set all three to the same canonical URL in Vercel (Production and Preview as needed). For local development, use `.env.local` with `http://localhost:3000` or an ngrok URL.

## Vercel domain setup

1. In the Vercel project, add **www.moodmnky.com** as the primary custom domain and **moodmnky.com** (apex) if desired.
2. Keep **mnky-command.moodmnky.com** and **mnky-verse.moodmnky.com** attached to the same project so the app can serve 301 redirects to www.
3. Point DNS for all domains to Vercel (or use Vercel DNS).

## Preview deployments

Vercel preview URLs do not match production hostnames. The proxy redirects unknown hosts to www with the same path; for previews, set `NEXT_PUBLIC_APP_URL` to the preview URL if you need correct absolute URLs during development.
