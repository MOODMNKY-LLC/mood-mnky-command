# Shopify Customer Account API: Step-by-step flow and credentials

**Status:** The previous "link your Shopify account for perks" UI and entry points have been removed. A new **Authenticate with Shopify** flow (OAuth 2.0 PKCE, token storage in Supabase, refresh, API on behalf of customers) will be implemented and will reuse the patterns below.

This document is a **read-only walkthrough** of how the Shopify Customer Account API OAuth 2.0 + PKCE flow works (or will work): each API call, each credential, and how Supabase stores PKCE state and tokens so the app can render data from the Customer Account API.

---

## Credentials and where they come from

| Purpose | Env variable(s) | Source | Used in |
|--------|-----------------|--------|---------|
| Store identity | `NEXT_PUBLIC_STORE_DOMAIN`, `PUBLIC_STORE_DOMAIN` | Shopify Admin (store) | Discovery URLs, token row `shop`, GraphQL base |
| Customer Account API client | `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` (or `NEXT_PUBLIC_...`) | Shopify App / Hydrogen channel → Customer Account API → Client ID | Auth URL, token exchange, refresh |
| App base URL (callback host) | `NEXT_PUBLIC_APP_URL`, `NGROK_DOMAIN`, `NEXT_PUBLIC_VERSE_APP_URL` | Your deployment / ngrok | `redirect_uri`, cookie domain, post-link redirect |
| Optional: override OIDC endpoints | `PUBLIC_CUSTOMER_ACCOUNT_API_AUTHORIZE_URL`, `PUBLIC_..._TOKEN_URL`, `PUBLIC_..._LOGOUT_URL` | Shopify Application endpoints panel | Skip discovery; use these URLs directly |
| Supabase (auth + DB) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase project | Session check, PKCE/token tables (service role) |

**Important:** Shopify does **not** use a client secret in this flow; the app uses the **public** Client ID and PKCE only. Storefront API tokens (e.g. `NEXT_PUBLIC_STOREFRONT_API_TOKEN`) are separate and used for unauthenticated storefront queries, not for Customer Account API.

---

## End-to-end flow (high level)

```mermaid
sequenceDiagram
  participant User
  participant App as Next.js App
  participant Supabase
  participant ShopifyAuth as Shopify OAuth
  participant ShopifyAPI as Customer Account API

  User->>App: GET /api/customer-account-api/auth
  App->>Supabase: getUser (session)
  alt No session
    App->>User: Redirect /auth/login?next=/verse
  else Has session
    App->>App: Generate PKCE state, verifier, challenge
    App->>Supabase: Insert verifier (state, verifier, profile_id)
    App->>User: 302 to Shopify authorize URL
  end
  User->>ShopifyAuth: Authorize (login)
  ShopifyAuth->>App: 302 to callback?code=...&state=...
  App->>Supabase: Get verifier by state
  App->>ShopifyAuth: POST token endpoint (code + code_verifier)
  ShopifyAuth->>App: access_token, refresh_token, id_token, expires_in
  App->>Supabase: Insert customer_account_tokens row
  App->>Supabase: Delete verifier; update profiles.shopify_customer_id
  App->>User: Set cookie, redirect /verse?shopify=linked
  User->>App: GET /verse (or /api/.../connection)
  App->>Supabase: Get token by cookie id + shop
  App->>ShopifyAPI: POST GraphQL (Bearer access_token)
  ShopifyAPI->>App: customer/orders data
  App->>User: Render UI
```

---

## Step 1: User starts OAuth (e.g. "Authenticate with Shopify")

**Request:** Browser navigates to `GET /api/customer-account-api/auth` (e.g. from a link or redirect).

**What the app does:**

1. **Supabase session check**  
   Uses `createClient()` from `lib/supabase/server` and calls `getUser()`.  
   - If no user: redirect to `/auth/login?next=/verse` so the user signs in first; after login they can start the auth flow again.  
   - If user exists: continue.

2. **Load config**  
   Config (e.g. in the new lib) reads env (trimmed):  
   - `storeDomain` from `NEXT_PUBLIC_STORE_DOMAIN` or `PUBLIC_STORE_DOMAIN`  
   - `clientId` from `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` (or next-public variant)  
   - `appUrl`: if request origin is localhost, use `NEXT_PUBLIC_APP_URL` or `NGROK_DOMAIN` or `NEXT_PUBLIC_VERSE_APP_URL`; otherwise use request origin.  
   - `authorizeUrl`: optional, from `PUBLIC_CUSTOMER_ACCOUNT_API_AUTHORIZE_URL`.

3. **Resolve authorization endpoint**  
   - If `authorizeUrl` is set: use it.  
   - Else: `GET https://${storeDomain}/.well-known/openid-configuration`, parse JSON, use `authorization_endpoint` (e.g. `https://shopify.com/authentication/{shop_id}/oauth/authorize`).

4. **Generate PKCE and state**  
   In `lib/shopify/customer-account-auth.ts`:  
   - `code_verifier` = 32 random bytes, base64url (Node `crypto`).  
   - `code_challenge` = SHA256(verifier), base64url.  
   - `state` = 16 random bytes, base64url.

5. **Supabase: store PKCE verifier**  
   Uses **admin** client (service role). Insert into `customer_account_code_verifiers`:  
   - `state` (unique), `verifier`, `profile_id` = `user.id`.  
   Tables: `supabase/migrations/20260216133359_customer_account_api.sql` + `supabase/migrations/20260219120001_customer_account_verifiers_profile_id.sql`.  
   RLS: service role only.

6. **Redirect to Shopify**  
   Build URL from `authorizationEndpoint` with query params:  
   - `client_id`, `response_type=code`, `redirect_uri=${appUrl}/api/customer-account-api/callback`,  
   - `scope=openid email customer-account-api:full`, `state`, `code_challenge`, `code_challenge_method=S256`.  
   Return `302` to that URL.

**Credentials used in Step 1:** `storeDomain`, `clientId`, `appUrl` (and optional `authorizeUrl`); Supabase for session and verifier storage.

---

## Step 2: User completes Shopify login (Shopify-hosted)

User is on Shopify's domain. They sign in (e.g. email + code). Shopify then redirects the browser to your callback URL with `code` and `state` (and optionally `error`). No API call from your app in this step; it's browser redirect only.

---

## Step 3: Callback – exchange code for tokens

**Request:** `GET /api/customer-account-api/callback?code=...&state=...` (from Shopify's redirect).

**What the app does:**

1. **Parse query**  
   Read `code`, `state`, `error`. On `error`, redirect to `/auth/login?error=shopify_auth_failed`. If `code` or `state` missing, redirect to login with `error=missing_params`.

2. **Config**  
   Same `getCustomerAccountApiConfig(request)` to get `storeDomain`, `clientId`, `appUrl`, and optional `tokenUrl`.

3. **Supabase: get PKCE verifier**  
   Admin client: `from('customer_account_code_verifiers').select('verifier, profile_id').eq('state', state).single()`.  
   If not found: redirect to login with `error=invalid_state`.

4. **Optional session check**  
   `createClient()` (cookie-based) → `getUser()`.  
   If **both** `user` and `verifierRow.profile_id` exist and `user.id !== verifierRow.profile_id`: redirect to login with `error=shopify_session_mismatch`.  
   Otherwise continue (session may be missing after cross-site redirect; we still have `profile_id` in the verifier).

5. **Resolve token endpoint**  
   If env `tokenUrl` set, use it. Else `GET https://${storeDomain}/.well-known/openid-configuration`, use `token_endpoint`.

6. **Token exchange (first server-to-Shopify API call)**  
   `POST` to token endpoint, `Content-Type: application/x-www-form-urlencoded`, body:  
   - `grant_type=authorization_code`, `client_id`, `redirect_uri` (must match exact callback URL registered in Shopify), `code`, `code_verifier` (from Supabase row).  
   Shopify returns JSON: `access_token`, `expires_in`, optionally `refresh_token`, `id_token`.

7. **Supabase: store tokens**  
   Admin client: insert into `customer_account_tokens`:  
   - `shop` = storeDomain, `access_token`, `expires_at` (from `expires_in`), `refresh_token`, `id_token`.  
   Tables: `supabase/migrations/20260216133359_customer_account_api.sql` + `supabase/migrations/20260301000000_customer_account_tokens_refresh_id_token.sql`.  
   Select `id` of the new row.

8. **Delete verifier**  
   `customer_account_code_verifiers` delete where `state = state` (one-time use).

9. **Fetch Shopify customer identity (second server-to-Shopify API call)**  
   `fetchCustomerWithToken(access_token, storeDomain)` in `lib/shopify/customer-account-client.ts`:  
   - `GET https://${storeDomain}/.well-known/customer-account-api` → get `api_url` (GraphQL endpoint).  
   - `POST` to that URL with `Authorization: Bearer {access_token}` and GraphQL query `GetCurrentCustomer` (id, displayName, emailAddress).  
   Used to get `customer.id` and optionally display name/email.

10. **Supabase: link profile**  
    `profileId = user?.id ?? verifierRow.profile_id`.  
    If we have `customer.id` and `profileId`: update `profiles` set `shopify_customer_id = customer.id` where `id = profileId`.  
    So the link is stored even when the callback request had no session cookie (`supabase/migrations/20260221100000_profiles_shopify_customer_id.sql`).

11. **Set cookie and redirect**  
    Set cookie `__customer_session` = token row **id** (UUID), httpOnly, path `/`, sameSite lax, maxAge 3600.  
    Redirect to `{requestOrigin}/verse?shopify=linked`.

**Credentials used in Step 3:** `storeDomain`, `clientId`, `appUrl`, optional `tokenUrl`; Supabase for verifier read, token insert, profile update; Shopify token endpoint and Customer Account GraphQL for customer identity.

---

## Step 4: Subsequent requests – using the stored "store credentials"

After the callback, the user has a cookie `__customer_session` whose **value is the UUID of a row in `customer_account_tokens`** (not the raw access token). The app never sends the access token to the browser.

**When any server code needs to call the Customer Account API (e.g. connection status, orders, profile):**

1. **Resolve access token**  
   `getCustomerAccessToken()` in `lib/shopify/customer-account-client.ts`:  
   - Read cookie `__customer_session` (token row id).  
   - Admin Supabase: select from `customer_account_tokens` where `id = tokenId` and `shop = storeDomain`, get `access_token`, `expires_at`, `refresh_token`.  
   - If token is expired or expiring within 60s and `refresh_token` exists:  
     - Resolve token endpoint (env or discovery).  
     - `POST` to token endpoint with `grant_type=refresh_token`, `client_id`, `refresh_token`.  
     - On success: update the same row with new `access_token`, `expires_at`, and optionally new `refresh_token`/`id_token`; return new access token.  
     - On 4xx / invalid_grant: delete the token row, return null (UI can show "Reconnect").  
   - Return the (possibly refreshed) `access_token`.

2. **Call Customer Account API**  
   - `getCustomerApiUrl()` in `lib/shopify/customer-account-client.ts`: `GET https://${storeDomain}/.well-known/customer-account-api` → `customer_account_api.api_url`.  
   - Any GraphQL call: `POST` to that URL with `Authorization: Bearer {access_token}` and JSON body `{ query, variables }`.  
   Example: `getCurrentCustomer()` / `customerAccountFetch()` for customer info; same pattern for orders, addresses, etc.

**Credentials used in Step 4:** `storeDomain` (for discovery and `shop` match); `clientId` and token endpoint for refresh; Supabase to read/update token row; Shopify GraphQL endpoint with the user's access token.

---

## Summary: API calls in order

| Step | Who | API call | Credentials / data |
|------|-----|----------|--------------------|
| 1a | App → Supabase | getUser() | Supabase session (cookie) |
| 1b | App → optional | GET `https://{storeDomain}/.well-known/openid-configuration` | storeDomain |
| 1c | App → Supabase | INSERT `customer_account_code_verifiers` | state, verifier, profile_id (user.id) |
| 1d | App → Browser | 302 to Shopify authorize URL | client_id, redirect_uri, scope, state, code_challenge |
| 2 | (User on Shopify; no app API call) | | |
| 3a | App → Supabase | SELECT verifier by state | state from query |
| 3b | App → optional | GET openid-configuration | storeDomain (for token_endpoint) |
| 3c | App → Shopify | POST token endpoint (code + code_verifier) | client_id, redirect_uri, code, code_verifier |
| 3d | App → Supabase | INSERT `customer_account_tokens` | shop, access_token, expires_at, refresh_token, id_token |
| 3e | App → Supabase | DELETE verifier by state | state |
| 3f | App → Shopify | GET customer-account-api well-known | storeDomain |
| 3g | App → Shopify | POST GraphQL GetCurrentCustomer (Bearer access_token) | access_token from token response |
| 3h | App → Supabase | UPDATE profiles set shopify_customer_id | profileId, customer.id |
| 3i | App → Browser | Set cookie + 302 /verse?shopify=linked | token row id in cookie |
| 4a | App → Supabase | SELECT token row by cookie id + shop | cookie, storeDomain |
| 4b | App → Shopify (if refresh needed) | POST token endpoint (refresh_token) | client_id, refresh_token |
| 4c | App → Supabase | UPDATE token row (after refresh) | new access_token, etc. |
| 4d | App → Shopify | GET customer-account-api well-known | storeDomain |
| 4e | App → Shopify | POST GraphQL (Bearer access_token) | access_token |

---

## Supabase tables (reference)

- **customer_account_code_verifiers** – One row per "Link Shopify" start: `state` (unique), `verifier` (PKCE), `profile_id` (Supabase user who started). Deleted after successful callback. RLS: service role only.
- **customer_account_tokens** – One row per linked session: `id` (UUID, stored in cookie), `shop`, `access_token`, `expires_at`, `refresh_token`, `id_token`. RLS: service role only.
- **profiles** – `shopify_customer_id` set when link completes; ties Supabase user to Shopify customer for order/XP and "linked" UI.

---

## Optional: Supabase MCP and docs

If you use the Supabase plugin MCP, you can inspect these tables (e.g. list tables, describe `customer_account_code_verifiers` and `customer_account_tokens`) to confirm schema. The flow does not require any Supabase Edge Functions; it uses the Next.js API routes and the Supabase JS client (server and admin) only. For a "start from scratch" checklist: ensure the migrations above are applied, env vars set (at least store domain, client ID, app URL), and Shopify Application endpoints have your callback and logout URLs allowlisted. See also [HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md](HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md) and [SHOPIFY-APP-URL-CONFIG.md](SHOPIFY-APP-URL-CONFIG.md).
