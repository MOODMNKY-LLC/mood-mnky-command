# Shopify Environment Variables – Reference and Project Updates

## Overview

This document lists all Shopify-related environment variables used in mood-mnky-command, their use cases, and recommended updates.

---

## Variable Reference

- **SHOPIFY_STORE_DOMAIN** (Server) — Admin API host. Used by `lib/shopify.ts`, `lib/shopify-admin-graphql.ts`, API routes (products, pages, labz-pages, metaobject sync, theme templates).
- **SHOPIFY_ADMIN_API_TOKEN** (Server) — Admin API auth. Required for LABZ pages, product sync, metaobject manga.
- **SHOPIFY_API_SECRET** (Server) — App secret; fallback for webhook HMAC when `SHOPIFY_WEBHOOK_SECRET` is unset.
- **SHOPIFY_WEBHOOK_SECRET** (Server) — Optional. Dedicated HMAC secret for order/paid webhooks. Falls back to `SHOPIFY_API_SECRET`.
- **NEXT_PUBLIC_STORE_DOMAIN** (Client+Server) — Store domain for Storefront API. Used by verse-providers, customer-account, profile.
- **PUBLIC_STORE_DOMAIN** (Server) — Server-side alias for Storefront API. Fallback when `NEXT_PUBLIC_` is unset.
- **NEXT_PUBLIC_STOREFRONT_API_TOKEN** (Client) — Storefront API public token for catalog.
- **PUBLIC_STOREFRONT_API_TOKEN** (Server) — Server-side Storefront token.
- **PRIVATE_STOREFRONT_API_TOKEN** (Server) — Private token for customer cart/checkout.
- **NEXT_PUBLIC_STOREFRONT_ID** (Client) — Hydrogen storefront ID.
- **PUBLIC_STOREFRONT_ID** (Server) — Server-side storefront ID.
- **PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID** (Client+Server) — OAuth client ID for Login with Shopify.
- **PUBLIC_CUSTOMER_ACCOUNT_API_URL** (Server) — Customer Account API base URL.
- **PUBLIC_CUSTOMER_ACCOUNT_API_*_URL** (Server) — Optional explicit authorize/token/logout endpoints.
- **SHOP_ID** (Server) — Shop ID for SSO logout redirect.
- **NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN** (Client) — Public store domain for Admin links (e.g. product edit).
- **NEXT_PUBLIC_APP_URL** (Client+Server) — App base URL for theme CTA and auth callbacks.
- **MOODMNKY_API_KEY** (Server) — Bearer key for internal APIs, Flowise tools, metaobject sync, notion sync.
- **APP_PROXY_JWT_SECRET** (Server) — Optional JWT secret for App Proxy. Falls back to `MOODMNKY_API_KEY`.

---

## Complete Env Block (Copy-Paste Reference)

```env
# =============================================================================
# Shopify – Admin API (server-side)
# =============================================================================
SHOPIFY_STORE_DOMAIN=mood-mnky-3.myshopify.com
SHOPIFY_ADMIN_API_TOKEN=shpat_xxxxx
SHOPIFY_API_SECRET=shpss_xxxxx
# SHOPIFY_WEBHOOK_SECRET=  # Optional; falls back to SHOPIFY_API_SECRET

# =============================================================================
# Shopify – Storefront API (Hydrogen / MNKY VERSE)
# =============================================================================
NEXT_PUBLIC_STORE_DOMAIN=mood-mnky-3.myshopify.com
PUBLIC_STORE_DOMAIN=mood-mnky-3.myshopify.com
NEXT_PUBLIC_STOREFRONT_API_TOKEN=xxxxx
PUBLIC_STOREFRONT_API_TOKEN=xxxxx
PRIVATE_STOREFRONT_API_TOKEN=shpat_xxxxx
NEXT_PUBLIC_STOREFRONT_ID=1000099429
PUBLIC_STOREFRONT_ID=1000099429

# =============================================================================
# Shopify – Customer Account API (Login with Shopify on /verse)
# =============================================================================
PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID=xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PUBLIC_CUSTOMER_ACCOUNT_API_URL=https://shopify.com/69343281426
PUBLIC_CUSTOMER_ACCOUNT_API_AUTHORIZE_URL=https://shopify.com/authentication/69343281426/oauth/authorize
PUBLIC_CUSTOMER_ACCOUNT_API_TOKEN_URL=https://shopify.com/authentication/69343281426/oauth/token
PUBLIC_CUSTOMER_ACCOUNT_API_LOGOUT_URL=https://shopify.com/authentication/69343281426/logout
SHOP_ID=69343281426

# =============================================================================
# MNKY VERSE – App URL and Theme Integration
# =============================================================================
NEXT_PUBLIC_APP_URL=https://mnky-command.moodmnky.com
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=mood-mnky-3.myshopify.com

# =============================================================================
# MNKY VERSE / Gamification – App Proxy & Internal API Auth
# =============================================================================
MOODMNKY_API_KEY=xxxxx
# APP_PROXY_JWT_SECRET=  # Optional; falls back to MOODMNKY_API_KEY
```

---

## Potential Project Updates

### 1. Consolidate Store Domain Variables

**Current:** `SHOPIFY_STORE_DOMAIN`, `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`, `NEXT_PUBLIC_STORE_DOMAIN`, `PUBLIC_STORE_DOMAIN` are all used.

**Recommendation:** Standardize on two concepts:

- **Admin / internal:** `SHOPIFY_STORE_DOMAIN` (server-only)
- **Storefront:** `NEXT_PUBLIC_STORE_DOMAIN` + `PUBLIC_STORE_DOMAIN` (with clear precedence)

Add a short doc or comment in `.env.example` on when to use each. Optionally add `SHOPIFY_STORE_DOMAIN` to `turbo.json` `globalPassThroughEnv` if Admin API is used from multiple packages.

### 2. Document Shopify CLI vs App Env Split

**Current:** `Shopify/.env` holds `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_ACCESS_TOKEN` (Shopify CLI / OAuth app). Root `.env*` holds Admin custom app token.

**Recommendation:** Add `docs/SHOPIFY-CLI-ENV.md` describing:

- Root env: custom app Admin API for the Next.js app
- `Shopify/.env`: Shopify CLI, theme push, theme dev
- `SHOPIFY_CLI_THEME_TOKEN` for CI/CD theme deploys

### 3. Add Verifier for Customer Account API

**Current:** Customer Account API vars can be misconfigured (trailing spaces, wrong format).

**Recommendation:** Extend `vercel-env-check.mjs` to:

- Validate `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` format (UUID)
- Trim and warn on trailing spaces
- Check `SHOP_ID` is numeric only

### 4. Separate Webhook Secret

**Current:** `SHOPIFY_WEBHOOK_SECRET` falls back to `SHOPIFY_API_SECRET`.

**Recommendation:** Prefer a dedicated `SHOPIFY_WEBHOOK_SECRET` in production and document that it must match the webhook subscription secret in Shopify Admin. Add to `VERCEL-ENV-SYNC.md` checklist.

### 5. Environment-Specific App URLs

**Current:** `NEXT_PUBLIC_APP_URL` is single-valued. Local dev uses ngrok.

**Recommendation:** Consider:

- `NEXT_PUBLIC_APP_URL` for production
- `.env.local` override for ngrok in dev
- Optional `NEXT_PUBLIC_APP_URL_PREVIEW` for Vercel preview deploys

Document in `docs/HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md`.

### 6. MOODMNKY_API_KEY Documentation

**Current:** Used in many places (Flowise, metaobject sync, notion sync, Discord, App Proxy) but not clearly documented.

**Recommendation:** Add `docs/MOODMNKY-API-KEY.md` with:

- Where it is used
- How to rotate it
- That Flowise `moodMnkyApiKey` must match
- Security practices (no exposure to client, no logging)

### 7. Add Shopify Section to `dev-notes.md`

**Recommendation:** Add a "Shopify Environment" section to `dev-notes.md` that:

- Lists the main Shopify vars
- Links to `docs/SHOPIFY-ENV-REFERENCE.md` and `docs/HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md`
- Notes where to get tokens (Hydrogen, Admin API, Notion Credentials)

### 8. `.env.example` Refresh

**Recommendation:** Ensure `.env.example` has:

- All Shopify vars grouped as above
- Comments explaining `PUBLIC_` vs `NEXT_PUBLIC_` for Customer Account API
- Note that `SHOP_ID` must have no trailing `\r\n` (Windows)
- Optional vars marked clearly (e.g. `SHOPIFY_WEBHOOK_SECRET`, `APP_PROXY_JWT_SECRET`)

---

## Implementation Priority

- **High** — Add `docs/SHOPIFY-ENV-REFERENCE.md` (this doc). Effort: Low.
- **High** — Extend `vercel-env-check` for Customer Account vars. Effort: Low.
- **Medium** — Document `MOODMNKY_API_KEY`. Effort: Low.
- **Medium** — Add Shopify env section to `dev-notes.md`. Effort: Low.
- **Medium** — Document Shopify CLI vs app env split. Effort: Medium.
- **Low** — Separate `SHOPIFY_WEBHOOK_SECRET` in prod. Effort: Low.
- **Low** — Review env-specific app URLs for preview. Effort: Medium.

---

## Related Docs

- [VERCEL-ENV-SYNC.md](VERCEL-ENV-SYNC.md) — Vercel env sync workflow
- [HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md](HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md) — Customer Account API setup
- [SHOPIFY-LABZ-PAGES-AND-MENU.md](SHOPIFY-LABZ-PAGES-AND-MENU.md) — LABZ pages and theme integration
