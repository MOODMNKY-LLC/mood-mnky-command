# Hydrogen Customer Account API – Full Configuration

Configure these values in **Shopify Admin → Sales channels → Hydrogen → MNKY VERSE → Storefront settings → Customer Account API → Application setup** (click Edit ✎).

**Client type:** Use **Public** client to see JavaScript origin(s) and Logout URI options.

---

## Production (dual domain)

The app is deployed on Vercel with two domains:
- **mnky-verse.moodmnky.com** – MNKY VERSE storefront (primary for Login with Shopify)
- **mnky-command.moodmnky.com** – MNKY LABZ admin/dashboard

### Callback URI(s)

Add both URLs (required for dual-domain support):

```
https://mnky-verse.moodmnky.com/api/customer-account-api/callback
https://mnky-command.moodmnky.com/api/customer-account-api/callback
```

### JavaScript origin(s)

Add both hostnames (no protocol, no path):

```
mnky-verse.moodmnky.com
mnky-command.moodmnky.com
```

### Logout URI(s)

Add these URLs (where Shopify redirects after logout):

```
https://mnky-verse.moodmnky.com
https://mnky-verse.moodmnky.com/verse
https://mnky-command.moodmnky.com
https://mnky-command.moodmnky.com/verse
```

---

## Local development (ngrok)

Shopify Customer Account API requires HTTPS and does not support localhost. Use ngrok to expose your local app.

### Step 1: Claim your free static ngrok domain

1. Sign up at [ngrok.com](https://ngrok.com)
2. Go to [Cloud Edge → Domains](https://dashboard.ngrok.com/cloud-edge/domains)
3. Click **+ New Domain** (or **Create Domain**)
4. Choose a subdomain or accept the auto-generated one (e.g. `unupbraiding-unilobed-eustolia.ngrok-free.dev`)
5. Copy your domain (e.g. `unupbraiding-unilobed-eustolia.ngrok-free.dev`)

### Step 2: Add your auth token

```bash
ngrok config add-authtoken <YOUR_AUTH_TOKEN>
```

Get your token from [ngrok Dashboard → Your Authtoken](https://dashboard.ngrok.com/get-started/your-authtoken).

### Step 3: Start the tunnel

In a **separate terminal** from `pnpm dev`:

```bash
# With your static domain (recommended – URL stays the same across restarts)
ngrok http --domain=<YOUR-DOMAIN> 3000

# Example:
# ngrok http --domain=unupbraiding-unilobed-eustolia.ngrok-free.dev 3000
```

Or use the project script (set `NGROK_DOMAIN` in `.env.local` first):

```bash
pnpm dev:tunnel
```

### Step 4: Configure Hydrogen with your ngrok URLs

Replace `<YOUR-DOMAIN>` with your ngrok domain (e.g. `unupbraiding-unilobed-eustolia.ngrok-free.dev`).

**Callback URI(s):**
```
https://<YOUR-DOMAIN>/api/customer-account-api/callback
```

**JavaScript origin(s):** (hostname only, no protocol)
```
<YOUR-DOMAIN>
```

**Logout URI(s):**
```
https://<YOUR-DOMAIN>
https://<YOUR-DOMAIN>/verse
```

### Step 5: Set environment variable

In `.env.local`:
```
NEXT_PUBLIC_APP_URL=https://<YOUR-DOMAIN>
NGROK_DOMAIN=<YOUR-DOMAIN>
```

### Step 6: Run the app

```bash
# Terminal 1: ngrok tunnel
pnpm dev:tunnel

# Terminal 2: Next.js dev server
pnpm dev
```

**Important:** Visit `https://<YOUR-DOMAIN>/auth/login` (the ngrok URL), not localhost. Shopify OAuth requires HTTPS and does not support localhost. With `NEXT_PUBLIC_APP_URL` set to your ngrok URL, the Login with Shopify button will use the correct callback even if you open localhost first.

---

## Shopify endpoints (from your Hydrogen dashboard)

These are shown in **Customer Account API → Application endpoints**:

| Endpoint | URL |
|----------|-----|
| Authorization | `https://shopify.com/authentication/69343281426/oauth/authorize` |
| Token | `https://shopify.com/authentication/69343281426/oauth/token` |
| Logout | `https://shopify.com/authentication/69343281426/logout` |

Our app uses OpenID discovery from the store domain (`https://${NEXT_PUBLIC_STORE_DOMAIN}/.well-known/openid-configuration`) for authorization, token, and end_session (logout) endpoints when not set via env. You can override with `PUBLIC_CUSTOMER_ACCOUNT_API_AUTHORIZE_URL`, `PUBLIC_CUSTOMER_ACCOUNT_API_TOKEN_URL`, and optionally `PUBLIC_CUSTOMER_ACCOUNT_API_LOGOUT_URL`.

**Callback and logout URLs in Shopify** must exactly match the app: add the callback URI(s) and logout URI(s) listed above to your app’s Allowed redirect URLs and Logout URIs in Shopify Admin.

### Token storage and refresh

We store `access_token`, `expires_at`, `refresh_token`, and `id_token` in `customer_account_tokens`. The refresh token is used to obtain a new access token when it expires or is about to expire; if refresh fails (e.g. `invalid_grant`), the user must re-link. The id_token is sent as `id_token_hint` to the end_session endpoint on logout for proper OIDC sign-out.

### Linking requires Supabase session

Linking a Shopify account is only available to users who are already signed in (Supabase: email/password, Discord, or GitHub). The login page message “Sign in below to link your Shopify account” reflects this: sign in first, then complete the Shopify OAuth flow to link. This is analogous to Discord/GitHub: Supabase OAuth establishes the app session; Shopify OAuth links an existing session to your store.

---

## Supabase vs Shopify – no custom app needed

**MNKY VERSE** (Shopify) and **MNKY LABZ** (Supabase) use separate auth systems:

| Path | Auth system | Purpose |
|------|-------------|---------|
| `/verse` | Shopify Customer Account API (OAuth) | Storefront customers |
| `/` (dashboard) | Supabase Auth (email/password) | Admin users |

You do **not** need a Supabase custom app for Shopify. The Shopify OAuth flow is handled by our Next.js API routes and stores tokens in Supabase tables (`customer_account_tokens`), but Supabase Auth is not involved for MNKY VERSE.

Supabase Auth is only used for MNKY LABZ admin login.

---

## Quick reference: ngrok commands

```bash
# After claiming your domain (see Local development section above)
ngrok config add-authtoken <YOUR_TOKEN>
ngrok http --domain=<YOUR-DOMAIN> 3000

# Or use the project script (set NGROK_DOMAIN in .env.local)
pnpm dev:tunnel
```
