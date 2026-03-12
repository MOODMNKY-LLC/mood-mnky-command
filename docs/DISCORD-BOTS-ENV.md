# Discord Agent Bots — Environment Variables

Required and optional env vars for the MNKY Discord bots stack (`services/discord-bots/`). Bots do **not** read Notion at runtime; copy token values into env at deploy time.

## Required (all bots)

| Variable | Where to set | Description |
|----------|--------------|-------------|
| `MOOD_MNKY_DISCORD_BOT_TOKEN` | `.env` or Compose `env_file` | Discord bot token for MOOD MNKY (Notion Credentials) |
| `SAGE_MNKY_DISCORD_BOT_TOKEN` | same | Discord bot token for SAGE MNKY |
| `CODE_MNKY_DISCORD_BOT_TOKEN` | same | Discord bot token for CODE MNKY |
| `MOODMNKY_API_KEY` | same | Web app internal API key (events, profile-by-discord-id, agent-reply) |
| `VERSE_APP_URL` | same | Web app base URL (e.g. `https://mnky-command.moodmnky.com`; local Docker: `http://host.docker.internal:3000`) |
| `REDIS_URL` | same | Redis connection (Compose: `redis://redis:6379`; local: `redis://localhost:6379`) |

## Optional

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | If bots call OpenAI directly instead of agent-reply API |
| `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` | If bots query Supabase for profile instead of web app profile-by-discord-id |
| `N8N_WEBHOOK_URL_*` | n8n webhook URLs for Discord-triggered workflows |

## Copying into your env

- **Repo root:** Copy `.env.example` to `.env` and to `.env.local` as needed. The root `.env.example` includes a "Discord Agent Bots" section; fill values from Notion Credentials and your Redis/URL.
- **Bot stack only:** In `services/discord-bots/`, copy `.env.example` to `.env` and fill for `docker compose up` or local runs.

Tokens: create three Discord applications in [Discord Developer Portal](https://discord.com/developers/applications), add Bot tokens to Notion Credentials (e.g. "MOOD MNKY Discord Bot Token", "SAGE MNKY Discord Bot Token", "CODE MNKY Discord Bot Token"), then paste into the corresponding env vars.

## Troubleshooting: Bots reach dev but not production

If the bots work with a **dev** app URL but fail when `VERSE_APP_URL` is set to **production** (e.g. `https://mnky-command.moodmnky.com`), check the following.

### 1. **API key mismatch (most common)**

The production app must have **the same** `MOODMNKY_API_KEY` that the bots send (or the bots must use the key that production has). The app validates `Authorization: Bearer <MOODMNKY_API_KEY>`; if it doesn’t match, you get **401 Unauthorized**. In Discord this often shows as “Something went wrong: Unauthorized” or a generic error.

- **Fix:** In your **production** environment (Vercel, etc.), set `MOODMNKY_API_KEY` to the same value you use in the bots’ `.env`. If you use different keys per environment, set the bots’ `MOODMNKY_API_KEY` to the **production** app’s key when pointing `VERSE_APP_URL` at production.

### 2. **Production app has no API key**

If `MOODMNKY_API_KEY` is not set in production at all, every internal API call returns 401.

- **Fix:** Add `MOODMNKY_API_KEY` to production env (same value the bots use).

### 3. **Network / TLS from where the bots run**

The bots call production over HTTPS. If they run in Docker or on a machine that can reach dev (e.g. `http://host.docker.internal:3000`) but not the internet, or behind a firewall/proxy that blocks outbound HTTPS, the request never reaches production (you’ll see errors like “Could not reach the app” or “ECONNREFUSED” / “ETIMEDOUT” in logs).

- **Check:** From the **same host/container** that runs the bots, run:
  ```bash
  curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer YOUR_MOODMNKY_API_KEY" "https://mnky-command.moodmnky.com/api/discord/agent-reply" -X POST -H "Content-Type: application/json" -d "{\"agentSlug\":\"code_mnky\",\"message\":\"hi\",\"discordUserId\":\"123\"}"
  ```
  - **200** → app and key are fine; issue is likely in the bot code or env (e.g. wrong `VERSE_APP_URL` in the running process).
  - **401** → key mismatch or missing in production (see 1 and 2).
  - **Connection error** → network/firewall/DNS/TLS from that host to production.

### 4. **Wrong URL in the running bots**

If you changed `.env` to production but restarted only the app (or didn’t restart the bots), they may still be using the old dev URL from when they started.

- **Fix:** Restart the Discord bot process(es) after changing `VERSE_APP_URL` (and/or `MOODMNKY_API_KEY`) so they load the new values.

### 5. **Windows: TLS certificate revocation check fails (HTTPS never completes)**

On Windows, the TLS stack (Schannel) may fail with **CRYPT_E_NO_REVOCATION_CHECK** when connecting to production over HTTPS. The handshake fails before any HTTP request is sent, so you see “Could not reach the app” or a connection error even though the API key and URL are correct. Dev works because it often uses HTTP (no TLS).

- **Fix (option A):** Run the bots in **Docker with a Linux image**. The container uses Linux’s TLS stack, which does not have this Windows revocation behavior.
- **Fix (option B):** When running the bots **directly on Windows** (e.g. `node dist/index.js`), set the env var **`NODE_TLS_REJECT_REVOCATION=0`** for the Node process (e.g. in your `.env` or in the same place you set `VERSE_APP_URL`). This tells Node to skip certificate revocation checking and allows the HTTPS connection to complete. Only use this in a trusted environment.

### 6. **Production returns 404 for `/api/discord/agent-reply`**

If the production app at `mnky-command.moodmnky.com` returns **404** for `POST /api/discord/agent-reply` (instead of 401 or 200), the deployed app may not include that route.

- **Fix:** Ensure the **production deployment** (e.g. Vercel project linked to the branch that has `app/api/discord/agent-reply/route.ts`) is the one serving `mnky-command.moodmnky.com`. Redeploy from the latest commit so API routes are included, and confirm the domain is assigned to that deployment.
