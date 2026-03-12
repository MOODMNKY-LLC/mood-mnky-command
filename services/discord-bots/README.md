# MNKY Discord Agent Bots (MOOD MNKY, SAGE MNKY, CODE MNKY, MNKY VERSE)

Discord extension of the MNKY agents: four bots backed by Redis and orchestrated via the web app, OpenAI, n8n, and Supabase (including gamification).

## Bots and commands

| Bot | Slash commands |
|-----|----------------|
| **MOOD MNKY** | `/mood`, `/scent`, `/blend`, `/verse` |
| **SAGE MNKY** | `/sage`, `/reflect`, `/learn`, `/dojo` |
| **CODE MNKY** | `/code`, `/deploy`, `/pr`, `/lab` |
| **MNKY VERSE** | `/verse`, `/drops`, `/quests`, `/rewards`, `/dojo`, `/ask` — Verse concierge (storefront, drops, quests, rewards, Dojo). |

## Env variables

Copy `.env.example` to `.env` (or use `env_file` in Compose). Required:

| Variable | Description |
|----------|-------------|
| `MOOD_MNKY_DISCORD_BOT_TOKEN` | Discord bot token for MOOD MNKY (Notion Credentials) |
| `SAGE_MNKY_DISCORD_BOT_TOKEN` | Discord bot token for SAGE MNKY (Notion Credentials) |
| `CODE_MNKY_DISCORD_BOT_TOKEN` | Discord bot token for CODE MNKY (Notion Credentials) |
| `MNKY_VERSE_DISCORD_BOT_TOKEN` | Discord bot token for MNKY VERSE (Verse concierge) |
| `MOODMNKY_API_KEY` | Web app internal API key (events, profile, agent-reply) |
| `VERSE_APP_URL` | Web app base URL (e.g. `https://mnky-command.moodmnky.com`) |
| `REDIS_URL` | Redis connection (e.g. `redis://redis:6379` in Compose) |

Optional: `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `N8N_WEBHOOK_URL_*`. See `.env.example`.

## Quick start

1. Create four Discord applications in [Discord Developer Portal](https://discord.com/developers/applications); create a Bot for each and copy tokens to Notion Credentials (or secure storage), then into `.env`.
2. Copy `.env.example` to `.env` and set all required variables.
3. **Invite each bot to your Discord server.** For each application, go to **OAuth2 → URL Generator**, select scopes **`bot`** and **`applications.commands`**, then open the generated URL and add the bot to your guild. You must do this for all four apps (MOOD MNKY, SAGE MNKY, CODE MNKY, **and MNKY VERSE**). If the MNKY VERSE bot is not in the server, its slash commands (`/verse`, `/drops`, `/quests`, `/rewards`, `/dojo`, `/ask`) will not appear.
4. From this directory: `docker compose up -d`.
5. Slash commands are registered automatically when each bot starts (see [Discord API](https://discord.com/developers/docs/interactions/application-commands)).

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
- [docs/DISCORD-MNKY-VERSE-BOT-DESIGN.md](../../docs/DISCORD-MNKY-VERSE-BOT-DESIGN.md) — MNKY VERSE bot role, skillset, and commands
