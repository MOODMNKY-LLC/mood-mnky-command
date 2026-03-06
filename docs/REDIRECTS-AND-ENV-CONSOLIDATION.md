# Single-Domain Consolidation: Redirects and Environment Variables

This document lists all redirects and production environment variables that must be updated when consolidating to **www.moodmnky.com** as the single canonical domain.

---

## 1. Domain-level redirects (Vercel or middleware)

Legacy production hosts only; localhost and Vercel preview hosts are not redirected.

| Source | Destination | Where configured |
|--------|-------------|------------------|
| `mnky-command.moodmnky.com` (root `/`) | `https://www.moodmnky.com/platform` | [apps/web/proxy.ts](apps/web/proxy.ts) (middleware) |
| `mnky-command.moodmnky.com/:path*` | `https://www.moodmnky.com/:path*` | [apps/web/proxy.ts](apps/web/proxy.ts) |
| `mnky-verse.moodmnky.com` (root `/`) | `https://www.moodmnky.com/dojo` | [apps/web/proxy.ts](apps/web/proxy.ts) |
| `mnky-verse.moodmnky.com/:path*` | `https://www.moodmnky.com/:path*` | [apps/web/proxy.ts](apps/web/proxy.ts) |
| `moodmnky.com` (apex) | `https://www.moodmnky.com` (same path) | [apps/web/proxy.ts](apps/web/proxy.ts) |

---

## 2. In-app redirects (next.config.mjs)

Already present; ensure they remain:

| Source | Destination |
|--------|-------------|
| `/verse` | `/dojo` |
| `/verse/community` | `/dojo/community` |
| `/verse/chat` | `/dojo/chat` |
| `/verse/:path*` | `/dojo/:path*` |
| `/dojo/profile` | `/dojo/me/profile` |
| `/dojo/profile/:path*` | `/dojo/me/profile/:path*` |
| `/dojo/crafting` | `/dojo/me/crafting` |
| `/dojo/crafting/:path*` | `/dojo/me/crafting/:path*` |
| `/dojo/preferences` | `/dojo/me/preferences` |
| `/dojo/flowise` | `/dojo/me/flowise` |
| `/dojo/flowise/:path*` | `/dojo/me/flowise/:path*` |

LABZ / back office consolidation:

| Source | Destination |
|--------|-------------|
| `/labz` | `/platform` |

Back office (MNKY LABZ) is served at `/platform`, `/store`, `/verse-backoffice`, etc. The path `/labz` redirects to `/platform` as a single entry alias; no route-group move was done so dashboard URLs stay under existing paths.

---

## 3. Production environment variables to change

Set in Vercel (and any other deployment) for the **web** app:

| Variable | Old (example) | New |
|----------|----------------|-----|
| `NEXT_PUBLIC_APP_URL` | `https://mnky-command.moodmnky.com` | `https://www.moodmnky.com` |
| `NEXT_PUBLIC_VERSE_APP_URL` | `https://mnky-verse.moodmnky.com` | `https://www.moodmnky.com` (or same as APP_URL) |
| `NEXT_PUBLIC_MAIN_APP_URL` | `https://www.moodmnky.com` | `https://www.moodmnky.com` (unchanged) |
| `STEAM_REALM` | `https://mnky-verse.moodmnky.com` | `https://www.moodmnky.com` |
| `STEAM_RETURN_URL` | `https://mnky-verse.moodmnky.com/api/auth/steam/callback` | `https://www.moodmnky.com/api/auth/steam/callback` |

For **Discord bots** (services/discord-bots):

| Variable | Old (example) | New |
|----------|----------------|-----|
| `VERSE_APP_URL` | `https://mnky-command.moodmnky.com` | `https://www.moodmnky.com` |

---

## 4. External / dashboard configuration (manual)

- **Supabase Dashboard** → Auth → URL Configuration: set Site URL to `https://www.moodmnky.com`; add Redirect URLs: `https://www.moodmnky.com/auth/callback`, `https://www.moodmnky.com/verse/auth/callback`. Remove or phase out command/verse domains after cutover.
- **Shopify** (Customer Account API, app proxy, theme): allow redirect/callback URLs for `https://www.moodmnky.com`. Theme and app embed base URL should point to `https://www.moodmnky.com`.
- **GitHub OAuth**: add `https://www.moodmnky.com/auth/callback` (or equivalent) to the OAuth app redirect allowlist.
- **Steam**: set realm and return URL to `https://www.moodmnky.com` (and callback path).
- **Nextcloud OAuth** (if used): set Redirection URL to `https://www.moodmnky.com/api/auth/nextcloud/callback`.

---

## 5. Codebase files that reference domains or APP_URL

| File | Change |
|------|--------|
| [apps/web/proxy.ts](apps/web/proxy.ts) | Single-domain redirect logic; root rewrite for www only. |
| [apps/web/components/main/main-nav-auth.tsx](apps/web/components/main/main-nav-auth.tsx) | Lab link: use relative `/platform` (or APP_URL + `/platform`). |
| [apps/web/app/(dashboard)/platform/storefront-assistant/page.tsx](apps/web/app/(dashboard)/platform/storefront-assistant/page.tsx) | Fallback URL → `https://www.moodmnky.com`. |
| [apps/web/app/api/verse/blog/route.ts](apps/web/app/api/verse/blog/route.ts) | Fallback → `https://www.moodmnky.com`. |
| [apps/web/app/api/storefront-assistant/route.ts](apps/web/app/api/storefront-assistant/route.ts) | Fallback → `https://www.moodmnky.com`. |
| [apps/web/lib/chat/storefront-tools.ts](apps/web/lib/chat/storefront-tools.ts) | Fallback → `https://www.moodmnky.com`. |
| [apps/web/lib/chat/storefront-system-prompt.ts](apps/web/lib/chat/storefront-system-prompt.ts) | Copy: mnky-command.moodmnky.com → www.moodmnky.com. |
| [apps/web/app/api/auth/nextcloud/callback/route.ts](apps/web/app/api/auth/nextcloud/callback/route.ts) | Comment: use www.moodmnky.com in example. |
| [apps/web/app/api/main/chat-demo/route.ts](apps/web/app/api/main/chat-demo/route.ts) | Comment/copy: mnky-verse → www.moodmnky.com. |
| [apps/web/lib/inngest/functions.ts](apps/web/lib/inngest/functions.ts) | Fallback → `https://www.moodmnky.com`. |
| [apps/code-mnky/components/agent-nav.tsx](apps/code-mnky/components/agent-nav.tsx) | MAIN_AUTH_URL fallback → `https://www.moodmnky.com/auth`. |
| [apps/mood-mnky/components/agent-nav.tsx](apps/mood-mnky/components/agent-nav.tsx) | Same. |
| [apps/sage-mnky/components/agent-nav.tsx](apps/sage-mnky/components/agent-nav.tsx) | Same. |
| [Shopify/theme/config/settings_data.json](Shopify/theme/config/settings_data.json) | `app_base_url` → `https://www.moodmnky.com`. |
| [Shopify/theme/templates/*.json](Shopify/theme/templates/) | iframe and app_base_url/verse_blog_url → `https://www.moodmnky.com`. |
| [Shopify/theme/sections/footer-group.json](Shopify/theme/sections/footer-group.json) | Blog link → `https://www.moodmnky.com/verse/blog` or `/dojo/blog`. |
| [extensions/mood-mnky-theme/locales/en.default.schema.json](extensions/mood-mnky-theme/locales/en.default.schema.json) | Example URL in schema → www.moodmnky.com. |
| [.env.example](.env.example) | Comments: Prod examples → `https://www.moodmnky.com`. |
| [services/discord-bots/.env.example](services/discord-bots/.env.example) | VERSE_APP_URL example → `https://www.moodmnky.com`. |
