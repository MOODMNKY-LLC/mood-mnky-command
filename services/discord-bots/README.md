# MNKY Discord Agent Bots (MOOD MNKY, SAGE MNKY, CODE MNKY)

Discord extension of the MNKY agents: three bots backed by Redis and orchestrated via the web app, OpenAI, n8n, and Supabase (including gamification).

## Env variables

Copy `.env.example` to `.env` (or use `env_file` in Compose). Required:

| Variable | Description |
|----------|-------------|
| `MOOD_MNKY_DISCORD_BOT_TOKEN` | Discord bot token for MOOD MNKY (Notion Credentials) |
| `SAGE_MNKY_DISCORD_BOT_TOKEN` | Discord bot token for SAGE MNKY (Notion Credentials) |
| `CODE_MNKY_DISCORD_BOT_TOKEN` | Discord bot token for CODE MNKY (Notion Credentials) |
| `MOODMNKY_API_KEY` | Web app internal API key (events, profile, agent-reply) |
| `VERSE_APP_URL` | Web app base URL (e.g. `https://mnky-command.moodmnky.com`) |
| `REDIS_URL` | Redis connection (e.g. `redis://redis:6379` in Compose) |

Optional: `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `N8N_WEBHOOK_URL_*`. See `.env.example`.

## Quick start

1. Create three Discord applications in [Discord Developer Portal](https://discord.com/developers/applications); create a Bot for each and copy tokens to Notion Credentials, then into `.env`.
2. Copy `.env.example` to `.env` and set all required variables.
3. From this directory: `docker compose up -d`.
4. Register slash commands per bot (see [Discord API](https://discord.com/developers/docs/interactions/application-commands)).

## Logging and debugging

All bots and the shared HTTP client log to **stdout** (info) and **stderr** (warn/error) so you can see output in the terminal and in container logs.

- **Terminal:** When you run a bot with `node dist/index.js` (or `pnpm start`), logs stream in the same window.
- **Docker:** Use `docker compose logs -f` to follow all services, or `docker compose logs -f code-mnky-bot` for one bot. Logs are one line per message with ISO timestamp, level, tag, and optional JSON fields.

**What gets logged:**

| When | Tag | Example |
|------|-----|--------|
| Bot startup | `[bot]` | `verse_app_url`, `api_key_set`, `redis_url_set` |
| Bot ready / slash commands | `[bot]` | `ready`, `slash_commands_registered` |
| Every agent-reply request | `[agent-reply]` | `request` with `url_host`, `path`, `agentSlug` |
| Agent-reply failure (network, 404, 401, non-JSON) | `[agent-reply]` | `request_failed`, `response_not_json`, `response_error` with `status`, `body_preview` |
| Profile resolve failure | `[profile]` | `profile_resolve_failed`, `profile_resolve_not_json` |
| Event ingestion failure | `[events]` | `events_post_failed`, `events_post_error` |
| Bot-level error (reply failed, event failed, fatal) | `[bot]` | `agent_reply_failed`, `event_ingestion_failed`, `fatal` with `error` and optional `stack` |

To debug 404s: look for `[agent-reply]` lines with `response_not_json` or `response_error` and check `status` and `body_preview` (e.g. status 404 and HTML in body means the route is not deployed at that URL).

## Repo docs

- [docs/DISCORD-BOTS-SETUP.md](../../docs/DISCORD-BOTS-SETUP.md) — Full setup (when added)
- [docs/DISCORD-BOTS-ENV.md](../../docs/DISCORD-BOTS-ENV.md) — Env vars and troubleshooting (production vs dev, Windows TLS, 404)
- [docs/DISCORD-INTEGRATION-PLAN.md](../../docs/DISCORD-INTEGRATION-PLAN.md) — Discord integration and events API
