# Nextcloud integration (MNKY CLOUD)

This document describes the MNKY CLOUD (Nextcloud) integration: env vars, OAuth2 client registration, callback route, QR code, and how it fits with Supabase Auth.

## Purpose

- **Status on Main and LABZ:** The app uses OAuth2 **client_credentials** to call the Nextcloud instance (OCS/WebDAV) for server-side status and storage quota. No user-facing “login with Nextcloud” is required for this.
- **OAuth2 redirect URI:** Nextcloud requires a redirection URL when creating the OAuth2 app; our callback route makes that URL valid and redirects users to the MNKY CLOUD service page.
- **Optional later:** A “Connect Nextcloud” (authorization code) flow could store tokens linked to the Supabase user (e.g. in `profiles` or `linked_accounts`); the same redirect URI and callback can be reused.

## Credentials and env vars

| Variable | Required | Where | Purpose |
|----------|----------|--------|---------|
| `NEXTCLOUD_URL` | Yes | .env / .env.local, Vercel | Nextcloud instance base URL (e.g. `https://cloud.example.com`). |
| `NEXTCLOUD_OAUTH_CLIENT_ID` | Yes | .env / .env.local, Vercel | OAuth2 Client Identifier from Nextcloud Admin. |
| `NEXTCLOUD_OAUTH_CLIENT_SECRET` | Yes | .env / .env.local, Vercel | OAuth2 Client Secret from Nextcloud Admin. |
| `NEXTCLOUD_ADMIN_USER` | No | .env / .env.local | Admin username (e.g. `admin`) for Basic/auth or admin operations. |
| `NEXTCLOUD_APP_PASSWORD` | No | .env / .env.local | Nextcloud app password (Settings → Security → Devices & sessions). Not the same as OAuth2 client secret. |

- **Sync to Vercel:** Add vars to `.env` or `.env.local`, then run `node apps/web/scripts/vercel-env-backup-pull-push.mjs` so production has them (script pushes vars that exist in `.env.example` and locally but are missing in Vercel).
- **Security:** Do not use `NEXT_PUBLIC_` for any of these. The callback route does not expose tokens; app password is stored only in env.

## OAuth2 client in Nextcloud

Register the app in **Nextcloud Admin → Security → OAuth2** (or **Administration → Security → OAuth 2.0**).

| Field | Value |
|-------|--------|
| **Name** | `MNKY Command` (or `MOOD MNKY Lab` if you prefer) |
| **Redirection URL** | `https://mnky-command.moodmnky.com/api/auth/nextcloud/callback` |

- Use the **LABZ backoffice domain** `mnky-command.moodmnky.com` so the redirect is consistent with other auth routes. If your Nextcloud instance allows multiple redirect URIs, you can also add `https://www.moodmnky.com/api/auth/nextcloud/callback` for Main-originated flows.
- After saving, Nextcloud shows **Client Identifier** and **Client Secret** — set those as `NEXTCLOUD_OAUTH_CLIENT_ID` and `NEXTCLOUD_OAUTH_CLIENT_SECRET` in `.env.local` and sync to Vercel.

Reference: [Nextcloud OAuth2 documentation](https://docs.nextcloud.com/server/latest/admin_manual/configuration_server/oauth2.html).

## Callback route

- **Path:** `GET /api/auth/nextcloud/callback`
- **File:** `apps/web/app/api/auth/nextcloud/callback/route.ts`
- **Behavior:** Accepts the redirect from Nextcloud (query params `code`, `state` are ignored for now). Redirects the user to `/main/services/mnky-cloud` using the request origin (or `x-forwarded-host` in production) so it works on mnky-command.moodmnky.com and locally.
- **Future:** If “Connect Nextcloud” is implemented, this route can exchange the `code` for tokens and store them keyed by Supabase user id (e.g. in `profiles` or a `linked_accounts` table).

## Supabase

- **No native Nextcloud provider:** Supabase Auth does not offer a built-in Nextcloud provider. Integration is done via **our app** as the OAuth2 client; the redirect URI is on our domain and the callback is our route.
- **Current:** Only client_credentials are used for server-side status; no change to Supabase Auth (GitHub, Discord, email, etc.).
- **Optional later:** “Link Nextcloud” for logged-in users: redirect to Nextcloud authorize URL with the same redirect URI; in the callback, exchange code for tokens and store them linked to `auth.users.id`.

## QR code (mobile app)

- **Asset:** Copy `temp/nextcloud-mobile-app-qr.png` to `apps/web/public/images/nextcloud-mobile-app-qr.png` so it is served at `/images/nextcloud-mobile-app-qr.png`.
- **Where shown:** On the MNKY CLOUD service page (`/main/services/mnky-cloud`), in the “Connect your device” block. Copy: “Scan to add MNKY CLOUD in the Nextcloud mobile app.”

## Full report summary

| Topic | Summary |
|-------|---------|
| Purpose | MNKY CLOUD status on Main/LABZ, valid OAuth2 redirect for Nextcloud, optional mobile QR and future “Connect Nextcloud”. |
| Credentials | URL + OAuth2 client id/secret (required); optional admin user and app password. All in env; sync via backup-pull-push script. |
| OAuth2 in Nextcloud | Name “MNKY Command”, redirect URI `https://mnky-command.moodmnky.com/api/auth/nextcloud/callback`. client_credentials used for status; same URI for future auth code flow. |
| Callback | Redirects to MNKY CLOUD page; later can do code exchange and store tokens. |
| Supabase | No native Nextcloud provider; integration via our app as OAuth client; optional link-account flow would store tokens by user id. |
| QR | Asset in `public/images/nextcloud-mobile-app-qr.png`; shown on MNKY CLOUD page. |
| Security | No `NEXT_PUBLIC_` secrets; callback does not expose tokens; app password only in env. |
