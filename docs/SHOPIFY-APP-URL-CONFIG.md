# Shopify app URL – sourcing and configuration

This doc explains how the **app URL** (base URL of the mood-mnky-command Next.js app) is sourced and where it must be set so the Shopify store theme works correctly.

## Canonical production URL

The production app is served at:

- **App / LABZ (admin):** `https://mnky-command.moodmnky.com`
- **Verse (storefront):** `https://mnky-verse.moodmnky.com`
- **Main (public marketing):** `https://www.moodmnky.com` (see `docs/MAIN-SECTION-DOMAINS.md`)

For **Shopify theme integration** (app embeds, App CTA, MNKY Assistant, Verse blog links, etc.), the **App base URL** must point at the **same app**. Both domains serve the same deployment; use one canonical base for the theme:

- **Use:** `https://mnky-command.moodmnky.com`  
  This is the app’s primary domain and what the codebase and Vercel env use as `NEXT_PUBLIC_APP_URL`.

**Do not use:** `https://app.moodmnky.com` — that subdomain is not the deployed app.

---

## How the app URL is sourced

### 1. Environment variable (source of truth)

| Variable | Purpose | Production value |
|----------|---------|------------------|
| `NEXT_PUBLIC_APP_URL` | Base URL of the app (LABZ, API, widget, blog). Used by server and client. | `https://mnky-command.moodmnky.com` |
| `NEXT_PUBLIC_VERSE_APP_URL` | Dojo storefront app base (auth callbacks, logout redirect when origin unknown). Storefront lives at `/dojo` (Option B). | `https://mnky-verse.moodmnky.com` |

- **Where set:** `.env` / `.env.local` (local), **Vercel** → Project → Settings → Environment Variables (production/preview).
- **Code:** Any runtime fallback when `NEXT_PUBLIC_APP_URL` is unset should use `https://mnky-command.moodmnky.com`, not `app.moodmnky.com`.

### 2. Where the app URL is used in code

- **Storefront Assistant** (`/api/storefront-assistant`, storefront tools, system prompt): links and `{app_base_url}` replacement use `NEXT_PUBLIC_APP_URL` (fallback: `https://mnky-command.moodmnky.com`).
- **Verse blog API** (`/api/verse/blog`): base URL for canonical links uses `NEXT_PUBLIC_APP_URL`.
- **LABZ Storefront Assistant page** (`/platform/storefront-assistant`): “App base URL” shown and copied for the theme uses `NEXT_PUBLIC_APP_URL` or `window.location.origin` in browser.
- **Customer Account API** (auth/callback/logout): callbacks and redirects use `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_VERSE_APP_URL`.
- **Authenticate with Shopify (when implemented):** OAuth will use `/api/customer-account-api/auth`; the server uses `request.nextUrl.origin` for the OAuth redirect_uri.
- **Funnels, Jotform webhooks, blend APIs, etc.:** webhook/base URLs use `NEXT_PUBLIC_APP_URL`.

### Shopify Customer Account API (Authenticate with Shopify)

The Customer Account API OAuth flow requires the **redirect_uri** sent to Shopify to exactly match a URL registered in your Shopify app (e.g. Hydrogen sales channel or custom app).

**Required env vars:** `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` (or `NEXT_PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID`), `NEXT_PUBLIC_STORE_DOMAIN` (or `PUBLIC_STORE_DOMAIN`). The server uses `request.nextUrl.origin` (or fallback `NEXT_PUBLIC_VERSE_APP_URL` / `NEXT_PUBLIC_APP_URL`) to build the callback URL. **Production must use real app URLs** (no ngrok in production env). Ensure `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` has no leading/trailing spaces or newlines; otherwise Shopify will reject the OAuth request with "invalid client credentials".

**Checklist – Allowed redirect URLs in Shopify Admin:**

Shopify requires **HTTPS** for redirect URLs; `http://localhost` is not accepted.

1. Go to your app (e.g. **Hydrogen** or **Customer Account API** app) → **Allowed redirect URLs** (or equivalent).
2. Add the exact **https** callback URL for each app domain you use:
   - `https://mnky-command.moodmnky.com/api/customer-account-api/callback`
   - `https://mnky-verse.moodmnky.com/api/customer-account-api/callback` (if Verse auth is on a different domain)
3. For **local dev**: Use a tunnel (e.g. **ngrok**) so you have an HTTPS origin. Add `https://<your-ngrok-domain>/api/customer-account-api/callback` to Allowed redirect URLs and set `NEXT_PUBLIC_APP_URL` (or `NEXT_PUBLIC_VERSE_APP_URL`) in `.env.local` to `https://<your-ngrok-domain>` so the OAuth flow uses that callback.

**Debug:** GET `/api/customer-account-api/auth-config` returns the callback URL for the current origin (no secrets). Use it to confirm which URL must be in Shopify’s Allowed redirect URLs.

### 3. Shopify theme (Theme Editor)

The theme does **not** read env vars. You set the **App base URL** in the Shopify Admin:

1. **Online Store** → **Themes** → **Customize**.
2. For each of the following, set **App base URL** (or equivalent) to **`https://mnky-command.moodmnky.com`** (no trailing slash):
   - **App embeds:** if your app provides an embed (e.g. MNKY Assistant), its settings include “App base URL” — set it to `https://mnky-command.moodmnky.com`.
   - **App CTA section** (if present): section setting **App base URL**.
   - **App blocks** (Blending CTA, Fragrance Finder, Subscription CTA, Verse blog, MNKY Assistant, etc.): each block has an **App base URL** (or **app_base_url**) setting; use the same value.
3. **Featured blog / Verse blog link:** if there is a “Verse blog URL” or similar, set it to `https://mnky-command.moodmnky.com/verse/blog` (or the same base + `/verse/blog`).

**Important:** The value in the theme must match your production app. If you use a different domain in Vercel (e.g. only `mnky-verse.moodmnky.com`), use that as the App base URL everywhere in the theme instead; the code’s fallback and this doc assume **mnky-command.moodmnky.com** as the canonical app URL.

---

## Checklist for adding the app to the Shopify store theme

1. **Vercel (production)**  
   - [ ] `NEXT_PUBLIC_APP_URL` = `https://mnky-command.moodmnky.com`  
   - [ ] `NEXT_PUBLIC_VERSE_APP_URL` = `https://mnky-verse.moodmnky.com` (if you use Verse auth/callbacks).

2. **Shopify Admin → Theme Editor**  
   - [ ] **App embeds:** enable the app’s embed(s) (e.g. MNKY Assistant). Set **App base URL** to `https://mnky-command.moodmnky.com`.  
   - [ ] **App CTA section:** set **App base URL** to `https://mnky-command.moodmnky.com`.  
   - [ ] **App blocks** (Blending CTA, Fragrance Finder, Subscription CTA, Verse blog, etc.): set **App base URL** / **app_base_url** to `https://mnky-command.moodmnky.com`.  
   - [ ] **Verse blog link** (if applicable): set to `https://mnky-command.moodmnky.com/verse/blog`.  
   - [ ] Save the theme.

3. **Optional – LABZ verification**  
   - [ ] In LABZ, open **Platform** → **Storefront Assistant**.  
   - [ ] Confirm “App base URL” shows `https://mnky-command.moodmnky.com` (or your chosen base).  
   - [ ] Use “Verify widget” and “Verify API” to confirm the assistant and API respond.

---

## Summary

| Context | What to set |
|--------|-------------|
| **Source of truth** | `NEXT_PUBLIC_APP_URL` in Vercel (and .env locally) = `https://mnky-command.moodmnky.com` |
| **Shopify theme – App base URL** | Same: `https://mnky-command.moodmnky.com` in every app embed/section/block that asks for it |
| **Verse blog link in theme** | `https://mnky-command.moodmnky.com/verse/blog` |
| **Do not use** | `https://app.moodmnky.com` (not the deployed app) |
