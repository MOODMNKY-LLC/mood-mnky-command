# Shopify Authenticate with Shopify – Environment Variables

This doc lists environment variables used for the **Authenticate with Shopify** flow (Customer Account API OAuth 2.0 + PKCE). Tables and webhooks that use `profiles.shopify_customer_id` are unchanged.

**Entry points:** The primary "Authenticate with Shopify" control is in the **Verse header** (Link Shopify button when not linked; tooltip with verified account when linked). Full link/unlink/reconnect management remains on the **Verse profile** page.

## Required

| Variable | Purpose | Where to get it |
|----------|---------|-----------------|
| `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` | OAuth client ID (public, no secret) | Shopify Admin → Hydrogen/Headless → Customer Account API → Credentials |
| `NEXT_PUBLIC_STORE_DOMAIN` or `PUBLIC_STORE_DOMAIN` | Store domain (e.g. `mood-mnky-3.myshopify.com`) | Shopify store |
| `NEXT_PUBLIC_APP_URL` | Base URL for callbacks and redirects | Your app URL (production or ngrok for local) |
| `NEXT_PUBLIC_VERSE_APP_URL` | Fallback when request origin is unavailable | Verse storefront URL (e.g. `https://mnky-verse.moodmnky.com`) |

**Important:** Trim spaces and newlines from `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID`; otherwise Shopify returns "invalid client credentials".

## Optional (recommended for stability)

Paste from Shopify **Application endpoints** to skip OpenID discovery:

| Variable | Purpose |
|----------|---------|
| `PUBLIC_CUSTOMER_ACCOUNT_API_AUTHORIZE_URL` | Authorization endpoint (e.g. `https://shopify.com/authentication/{SHOP_ID}/oauth/authorize`) |
| `PUBLIC_CUSTOMER_ACCOUNT_API_TOKEN_URL` | Token endpoint |
| `PUBLIC_CUSTOMER_ACCOUNT_API_LOGOUT_URL` | End session / logout endpoint |

## Local development

- Shopify does **not** accept `http://localhost` for redirect URLs. Use an HTTPS tunnel (e.g. **ngrok**).
- Set `NEXT_PUBLIC_APP_URL` (or `NGROK_DOMAIN` if your code supports it) to your **https** ngrok URL, e.g. `https://your-subdomain.ngrok-free.app`.
- Add the callback and logout URIs for that ngrok URL in Shopify Admin → Customer Account API → Application setup.

## Production

- Set `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_VERSE_APP_URL` to your real app domains.
- Add both callback URLs to Shopify (e.g. `https://mnky-verse.moodmnky.com/api/customer-account-api/callback`, `https://mnky-command.moodmnky.com/api/customer-account-api/callback` if both are used).

## Not needed

- **Client secret:** The Customer Account API flow uses a **public** client with PKCE only; no `client_secret` is required.

See also: [HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md](HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md), [SHOPIFY-APP-URL-CONFIG.md](SHOPIFY-APP-URL-CONFIG.md), [VERCEL-ENV-SYNC.md](VERCEL-ENV-SYNC.md).
