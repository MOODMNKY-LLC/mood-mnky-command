# Deployed Services – Environment and credentials

This document describes the environment variables used for the **Deployed Services** (MNKY CLOUD, MNKY MEDIA, MNKY DRIVE, MNKY AUTO, MNKY AGENTS) and the **Service Analytics** section in LABZ. When configured, these allow the app to show live status and metrics on `/main/services/[slug]` and in LABZ **Platform → Service Analytics**.

Credentials are **server-only**; never use `NEXT_PUBLIC_` for API keys or secrets.

## Per-service variables

| Service | Variables | Purpose |
|--------|-----------|---------|
| **MNKY CLOUD** (Nextcloud) | `NEXTCLOUD_URL`, `NEXTCLOUD_OAUTH_CLIENT_ID`, `NEXTCLOUD_OAUTH_CLIENT_SECRET` | Instance URL and OAuth2 client credentials. Used to obtain an access token and call OCS/WebDAV for status and storage quota. See [Nextcloud integration](NEXTCLOUD-INTEGRATION.md) for OAuth2 app name, redirect URI, callback route, and optional admin/app password. |
| **MNKY MEDIA** (Jellyfin) | `JELLYFIN_BASE_URL`, `JELLYFIN_API_KEY` | Server URL and API key. Auth: `MediaBrowser Token="..."` header. Used for `/System/Info`, `/Users`, `/health`, library counts. |
| **MNKY DRIVE** (TrueNAS Scale) | `TRUENAS_BASE_URL`, `TRUENAS_API_KEY` | TrueNAS URL and 64-char user API key (HTTPS required). Used for pool/dataset status and storage metrics. Newer SCALE uses JSON-RPC over WebSocket. |
| **MNKY AUTO** (n8n) | `N8N_API_URL`, `N8N_API_KEY` | Already in `.env.example`. Base URL and API key; header `X-N8N-API-KEY`. Used for workflow list/count and active workflows. |
| **MNKY AGENTS** (Flowise) | `FLOWISE_BASE_URL`, `FLOWISE_API_KEY` | Already in `.env.example`. Used for chatflow list/count and health. |
| **MNKY GAMES** (featured: Palworld) | `PALWORLD_SERVER_URL`, `PALWORLD_API_PASSWORD`, optional `PALWORLD_API_USER` | Palworld dedicated server REST API (RESTAPIEnabled=True, RESTAPIPort default 8212). HTTP Basic Auth; password = server’s AdminPassword. Used for GET /info (version, servername) and GET /players (player count). Live status on MNKY GAMES card reflects the featured game. Not designed for direct Internet exposure—use behind VPN or proxy. |
| **Steam** (MNKY GAMES — Link Steam) | `STEAM_WEB_API_KEY`; optional `STEAM_REALM`, `STEAM_RETURN_URL` | From [Steam Web API Key](https://steamcommunity.com/dev/apikey). Server-only; used for GetPlayerSummaries after linking. When `STEAM_REALM` and `STEAM_RETURN_URL` are set (e.g. `https://mnky-verse.moodmnky.com` and `https://mnky-verse.moodmnky.com/api/auth/steam/callback`), the OpenID flow is pinned to that domain; otherwise request origin is used. Sync to Vercel for the env where the app runs. |
| **MOOD MNKY Experience** | (none) | Uses existing Shopify/verse integrations; no separate service API. |

## Behavior when unset

- **Public `/main/services/[slug]`:** Status/live block is hidden or shows “Status unavailable.” Static content (name, tagline, description, features) always comes from `lib/main-services-data.ts`.
- **LABZ Service Analytics:** Each service card shows “Not configured” with a link to this doc or `.env.example`. No credentials are requested from the client.

## Security

- Store keys in `.env` or `.env.local` (gitignored). Never commit secrets.
- Public status API (`GET /api/main/services/[slug]/status`) returns only safe, high-level data (e.g. “operational”, counts). No internal hostnames, ports, or error details.
- LABZ analytics API (`GET /api/labz/services/analytics`) requires admin session (same as dashboard stats).

## LABZ DB-stored credentials (deployed_services)

The Supabase table `deployed_services` stores service credentials encrypted at rest. To use **Platform → Settings → Deployed services** (add/edit credentials in LABZ):

1. **Supabase**: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set (same as other LABZ features). Run migrations so the `deployed_services` table exists.
2. **Encryption key**: Set `SERVICES_CREDENTIALS_ENCRYPTION_KEY` (min 16 chars; recommend 32-byte hex). Generate with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Add to `.env.local` and to **Vercel → Project → Settings → Environment Variables** for production. Then run `pnpm vercel:env-sync` from repo root (or add the variable manually in Vercel).

If either Supabase or the encryption key is missing, the Settings page shows a clear message and the deployed services list will not load until fixed.
