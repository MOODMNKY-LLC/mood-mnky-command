# Vercel Environment Variables

This document lists environment variables that must be set in Vercel for production and preview deployments.

## Sync Commands

**Env file layout:** `.env.local` (local dev), `.env` (staging for Vercel push), `.env.production` (Vercel pull target). `pnpm dev` loads `.env.local` and `.env` only; `.env.production` is not used for local development.

```bash
# Pull production vars from Vercel to .env.production (never overwrites .env or .env.local)
vercel env pull .env.production --environment=production

# Push new vars: add to .env or .env.local, then run
pnpm vercel:env-sync

# Or use backup-pull-push: backs up, pulls to .env.production, pushes vars from .env/.env.local that are missing in production
node apps/web/scripts/vercel-env-backup-pull-push.mjs

# Add a variable (interactive - prompts for value)
vercel env add VARIABLE_NAME production
vercel env add VARIABLE_NAME preview
```

**To push vars from a temp file:** Merge content into `.env` (or `.env.local`), then run `pnpm vercel:env-sync` or `vercel-env-backup-pull-push.mjs`.

**Validate locally before deploying:**

```bash
pnpm vercel:env-check
```

## Required Variables Checklist

### Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_SUPABASE_PROJECT_REF` (optional)

### Shopify / MNKY VERSE
- [ ] `SHOPIFY_STORE_DOMAIN`
- [ ] `SHOPIFY_ADMIN_API_TOKEN`
- [ ] `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`
- [ ] `NEXT_PUBLIC_STORE_DOMAIN`
- [ ] `PUBLIC_STORE_DOMAIN`
- [ ] `NEXT_PUBLIC_STOREFRONT_API_TOKEN`
- [ ] `PUBLIC_STOREFRONT_API_TOKEN`
- [ ] `PRIVATE_STOREFRONT_API_TOKEN`
- [ ] `NEXT_PUBLIC_STOREFRONT_ID`
- [ ] `PUBLIC_STOREFRONT_ID`
- [ ] `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` (for Customer Account API / Authenticate with Shopify when implemented)
- [ ] `PUBLIC_CUSTOMER_ACCOUNT_API_URL` (optional)
- [ ] `SHOP_ID` (required for full SSO logout; e.g. `69343281426`)

### App
- [ ] `NEXT_PUBLIC_APP_URL` (e.g. `https://mnky-command.moodmnky.com` – admin/dashboard base)
- [ ] `NEXT_PUBLIC_VERSE_APP_URL` (e.g. `https://mnky-verse.moodmnky.com` – verse storefront base, used when request origin unavailable)
- [ ] `NEXT_PUBLIC_MAIN_APP_URL` (e.g. `https://www.moodmnky.com` – main public marketing site canonical URL)

### Optional
- [ ] `NOTION_API_KEY`
- [ ] `JOTFORM_API_KEY`
- [ ] `OPENAI_API_KEY`
- [ ] `MEDIA_API_KEY`
- [ ] `FLOWISE_API_KEY`
- [ ] `NEXT_PUBLIC_FLOWISE_HOST`
- [ ] `NEXT_PUBLIC_FLOWISE_CHATFLOW_ID`

---

## Shopify Customer Account API – Hydrogen configuration

**Full configuration:** See [HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md](./HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md) for Callback URI(s), JavaScript origin(s), and Logout URI(s).

### Production URLs (add in Shopify Admin → Hydrogen → MNKY VERSE → Customer Account API → Application setup)

| Field | Value |
|-------|-------|
| **Callback URI(s)** | `https://mnky-verse.moodmnky.com/api/customer-account-api/callback`, `https://mnky-command.moodmnky.com/api/customer-account-api/callback`, `https://www.moodmnky.com/api/customer-account-api/callback` |
| **JavaScript origin(s)** | `https://mnky-verse.moodmnky.com`, `https://mnky-command.moodmnky.com`, `https://www.moodmnky.com` (full HTTPS URL) |
| **Logout URI(s)** | `https://mnky-verse.moodmnky.com`, `https://mnky-verse.moodmnky.com/verse`, `https://mnky-command.moodmnky.com`, `https://mnky-command.moodmnky.com/verse`, `https://www.moodmnky.com`, `https://www.moodmnky.com/main` |

**Note:** Use **Public** client type to see JavaScript origin(s) and Logout URI options.

---

## Local development – Customer Account API

### Why ngrok is required (not local HTTPS)

Shopify’s Customer Account API **does not support localhost or HTTP URLs** for OAuth callbacks. This is documented in Shopify’s docs and community:

- [Shopify docs](https://shopify.dev/docs/storefronts/headless/building-with-the-customer-account-api/getting-started): *"Shopify doesn't support the use of localhost or any http based URL due to security concerns. For development purposes, we recommend using a tunnelling service, such as ngrok."*
- [Hydrogen GitHub](https://github.com/Shopify/hydrogen/discussions/1893): *"For a variety of security reasons, we have yet to allow localhost URLs as a redirect destinations from Shopify's domain. This is why ngrok, or something is needed to proxy localhost to an actual publicly accessible domain."*

**Using `pnpm dev:https` or Supabase `[api.tls]` does not help:**

- **Next.js `--experimental-https`** gives `https://localhost:3000`, but Shopify still rejects localhost.
- **Supabase `config.toml` `[api.tls]`** is for the **Supabase local API** (port 54321), not for the Next.js app. The OAuth callback hits the Next.js app, so Supabase TLS has no effect on this flow.

**Conclusion:** ngrok (or cloudflare tunnel, localtunnel) is required for local Customer Account API testing.

### Local development setup

See [HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md](./HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md) for full ngrok setup:

1. Claim a free static domain at [ngrok Cloud Edge → Domains](https://dashboard.ngrok.com/cloud-edge/domains)
2. Add auth token: `ngrok config add-authtoken <token>`
3. Run `pnpm dev:tunnel` (or `ngrok http --domain=<YOUR-DOMAIN>.ngrok-free.app 3000`) in a separate terminal
4. Add Callback URI(s), JavaScript origin(s), Logout URI(s) to Hydrogen (see config doc)
5. Set `NEXT_PUBLIC_APP_URL` and `NGROK_DOMAIN` in `.env.local` (dev domain: `unupbraiding-unilobed-eustolia.ngrok-free.dev`)
6. Run `pnpm dev`

---

## Customer Account API – Production checklist

- [ ] `NEXT_PUBLIC_APP_URL` = `https://mnky-command.moodmnky.com`
- [ ] `NEXT_PUBLIC_VERSE_APP_URL` = `https://mnky-verse.moodmnky.com`
- [ ] `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID` set (from Hydrogen Customer Account API credentials)
- [ ] `SHOP_ID` set (e.g. `69343281426`) – used for full SSO logout redirect
- [ ] Hydrogen Application setup: Callback URI(s), JavaScript origin(s), Logout URI(s) – see [HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md](./HYDROGEN-CUSTOMER-ACCOUNT-API-CONFIG.md)
- [ ] Supabase production redirect URLs (both domains) – see [SUPABASE-REDIRECT-URLS.md](./SUPABASE-REDIRECT-URLS.md)
