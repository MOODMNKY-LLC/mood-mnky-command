# MNKY Discord Agent Bots — Setup Guide

This guide covers setting up the four Discord agent bots (MOOD MNKY, SAGE MNKY, CODE MNKY, MNKY VERSE) that extend the MNKY agents into Discord. They use a shared Redis-backed Docker Compose stack and are orchestrated via the web app (profile resolution, event ingestion, agent replies).

## 1. Notion Credentials

Document four credential entries in [Notion Credentials](https://www.notion.so/mood-mnky/Credentials-95da498bdc724b4190fe67dcd61e23de), one per bot:

- **MOOD MNKY Discord Bot Token**
- **SAGE MNKY Discord Bot Token**
- **CODE MNKY Discord Bot Token**
- **MNKY VERSE Discord Bot Token**

Values are the Discord **Bot** tokens from the Discord Developer Portal (not the client secret). Bots do **not** read Notion at runtime; copy token values into env at deploy time.

## 2. Discord applications (four bots)

1. Go to [Discord Developer Portal](https://discord.com/developers/applications).
2. Create **four** applications (e.g. "MOOD MNKY", "SAGE MNKY", "CODE MNKY", "MNKY VERSE").
3. For each application:
   - Open **Bot** and click **Add Bot**. Copy the token into Notion (and later into `.env`).
   - Under **OAuth2 → URL Generator**, select scopes: `bot`, `applications.commands`. Copy the generated URL.
4. **Invite all four bots to the same guild** (e.g. MNKY VERSE community server). Open each OAuth2 URL in a browser and authorize the bot for your server. If you do not invite the **MNKY VERSE** bot, its slash commands (`/verse`, `/drops`, `/quests`, `/rewards`, `/dojo`, `/ask`) will not appear in Discord.

Slash commands are **registered automatically** when each bot starts (see [services/discord-bots/README.md](../services/discord-bots/README.md)).

## 3. Environment variables

From `services/discord-bots/`, copy `.env.example` to `.env` and set:

| Variable | Description |
|----------|-------------|
| `MOOD_MNKY_DISCORD_BOT_TOKEN` | From Notion: MOOD MNKY Discord Bot Token |
| `SAGE_MNKY_DISCORD_BOT_TOKEN` | From Notion: SAGE MNKY Discord Bot Token |
| `CODE_MNKY_DISCORD_BOT_TOKEN` | From Notion: CODE MNKY Discord Bot Token |
| `MNKY_VERSE_DISCORD_BOT_TOKEN` | From Notion: MNKY VERSE Discord Bot Token |
| `MOODMNKY_API_KEY` | Web app internal API key (same as used for `POST /api/discord/events`) |
| `VERSE_APP_URL` | Web app base URL (e.g. `https://mnky-command.moodmnky.com`; local: `http://host.docker.internal:3000`) |
| `REDIS_URL` | In Compose: `redis://redis:6379` (default in compose); local run: `redis://localhost:6379` |

See [docs/DISCORD-BOTS-ENV.md](DISCORD-BOTS-ENV.md) for optional vars (OpenAI, Supabase, n8n).

## 4. Docker Compose

From the repo root or from `services/discord-bots/`:

```bash
cd services/discord-bots
docker compose up -d
```

This starts Redis and the four bot services. Bots depend on Redis (healthcheck). Logs: `docker compose logs -f mood-mnky-bot` (or `sage-mnky-bot`, `code-mnky-bot`, `mnky-verse-bot`).

## 5. Web app APIs used by the bots

Bots call the web app with `Authorization: Bearer <MOODMNKY_API_KEY>`:

- **GET /api/discord/profile-by-discord-id?discordUserId=...**  
  Returns `{ profileId: string | null }` from `profiles` where `discord_user_id = discordUserId`. Used to resolve Discord user to profile for event ingestion.

- **POST /api/discord/events**  
  Payload: `profileId`, `discordUserId`, `guildId`, `channelId?`, `eventType`, `eventRef?`, `value?`. Events are sent to Inngest `discord/event.received` → `discord_event_ledger` → `quest/evaluate`. Only sent when a profile is found (linked Discord account).

- **POST /api/discord/agent-reply**  
  Body: `{ agentSlug, message, discordUserId?, channelId? }`. Returns `{ text }` (or `{ error }`). Uses `agent_profiles.system_instructions` and OpenAI to produce a single-turn reply. Keeps agent behavior and tools centralized in the web app.

## 6. Slash commands per bot

| Bot | Commands |
|-----|----------|
| MOOD MNKY | `/mood` (query), `/scent` (fragrance), `/blend` (theme), `/verse` (link to MNKY VERSE) |
| SAGE MNKY | `/sage` (question), `/reflect` (topic), `/learn` (topic), `/dojo` (link to Dojo) |
| CODE MNKY | `/code` (question), `/deploy` (context), `/pr` (topic), `/lab` (link to LABZ) |
| MNKY VERSE | `/verse`, `/drops`, `/quests`, `/rewards`, `/dojo`, `/ask` — Verse concierge (see [DISCORD-MNKY-VERSE-BOT-DESIGN.md](DISCORD-MNKY-VERSE-BOT-DESIGN.md)) |

## 7. Gamification and event ingestion

When a user runs a slash command and their Discord user ID is linked to a profile (`profiles.discord_user_id`), the bot sends a `message` event to `POST /api/discord/events` with `eventRef: slash:<commandName>`. That triggers the existing pipeline: Inngest `discord/event.received` → `discord_event_ledger` → `quest/evaluate`. Link Discord in Verse via **Link Discord account** so that slash command usage counts toward quests and XP.

## 8. References

- [DISCORD-INTEGRATION-PLAN.md](DISCORD-INTEGRATION-PLAN.md) — Overall Discord plan and Phase D (Agent Bots)
- [DISCORD-BOTS-ENV.md](DISCORD-BOTS-ENV.md) — Env variable reference
- [services/discord-bots/README.md](../services/discord-bots/README.md) — Quick start and Compose
- [GAMIFICATION-TOUCHPOINTS.md](GAMIFICATION-TOUCHPOINTS.md) — Events, ledger, quests
