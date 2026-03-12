# Shopify API Integration Roadmap

This document outlines a phased roadmap for integrating Shopify APIs across the mood-mnky-command app: **MNKY VERSE** (user-facing storefront and profile) and **MNKY LABZ** (backend, config, and admin).

## APIs in scope

| API | Purpose | Current use |
|-----|---------|-------------|
| **Storefront API** | Catalog, cart, checkout, storefront UX | Verse: products, collections, cart; Hydrogen React client |
| **Customer Account API** | Identity, orders, profile, returns (headless) | OAuth PKCE link; tokens in Supabase; order→profile resolution |
| **Admin API (GraphQL)** | Merchants, products, orders, config | LABZ: products, media, theme; webhooks |
| **Webhooks** | Events (orders, paid, etc.) | Order/paid → Inngest → XP; profile resolution by `shopify_customer_id` |

---

## Roadmap themes

### Verse (user-facing)

- **Account & identity:** Header Shopify link + tooltip; optional: "My orders" / order status using Customer Account API.
- **Commerce:** Deepen Storefront API usage — wishlists, recently viewed, personalized recommendations using Customer Account + Storefront.
- **Unified profile:** "Shopify account" in profile (already present); optional: pull default address or preferences from Customer Account API for checkout prefill.
- **Agents / MCP:** If Verse or LABZ agents act on behalf of the user, use `getAccessTokenForProfile(profileId)` to call Customer Account API (orders, returns) or Storefront (cart) from server-side tools.

### LABZ (backend / config)

- **Catalog & content:** Continue Admin API for product/collection sync, media push, metaobjects; optional: sync Notion/Verse content to Shopify (blogs, pages).
- **Theme & storefront:** Theme app extensions, app proxy (e.g. `/apps/mnky/session`), and Storefront API config already in place; roadmap: more app blocks, theme sections that call app APIs.
- **Webhooks & automation:** Extend order/paid webhooks (Inngest) for XP, rewards, or fulfillment; optional: customer creation/update webhooks to keep Supabase profile in sync with Shopify customer.
- **Analytics & reporting:** Use Admin API (and optional Shopify Analytics) for dashboards in LABZ (orders, top products, conversion) and expose simplified metrics per Built for Shopify guidelines.

### Cross-cutting

- **Security & tokens:** Keep Customer Account tokens in Supabase with refresh; ensure Admin API tokens and webhook secrets are env-based and not exposed to the client.
- **Docs:** Keep [VERSE-STOREFRONT-STACK.md](VERSE-STOREFRONT-STACK.md), [HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md](HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md), and [SHOPIFY-MNKY-VERSE-INTEGRATION-REPORT.md](SHOPIFY-MNKY-VERSE-INTEGRATION-REPORT.md) updated; this roadmap doc tracks phased initiatives.

---

## Phased initiatives

### Phase 1 (current)

- Header Shopify link + tooltip; connection API returns `displayName` for verified user data in tooltip.
- Hero no longer shows "Authenticate with Shopify" CTA; primary entry is header; profile retains full link/unlink/reconnect.

### Phase 2

- Verse "My orders" or order status using Customer Account API.
- Optional: Reconnect flow in header tooltip (link to re-auth when token invalid).

### Phase 3

- LABZ dashboards using Admin API (orders, products).
- Optional: webhook expansion (customer creation/update for profile sync).

### Phase 4

- Agent/MCP tools that use Customer Account + Storefront on behalf of linked users.
- Personalized Verse experiences (recommendations, checkout prefill).

### Phase 5

- Deeper theme/app extension features.
- Optional: Oxygen or multi-store considerations if product expands.

---

## References

- [HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md](HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md) — Customer Account API setup, callbacks, ngrok.
- [SHOPIFY-AUTH-ENV.md](SHOPIFY-AUTH-ENV.md) — Env vars for Authenticate with Shopify.
- [SHOPIFY-MNKY-VERSE-INTEGRATION-REPORT.md](SHOPIFY-MNKY-VERSE-INTEGRATION-REPORT.md) — Brand integration, theme, and copy.
- [VERSE-STOREFRONT-STACK.md](VERSE-STOREFRONT-STACK.md) — Next.js + Hydrogen React, Storefront API.
