# Discord Integration — Comprehensive Plan (MOOD MNKY)

This document is the single app-wide plan for Discord integration, including the MNKY BOX / drop experience and existing features. The **server map** (categories, channels, MNKY categories) is in [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md). For ad-hoc inspection use the **Discord MCP** (project `mnky-verse-discord`) with `discord_get_server_info` (pass `guildId` from LABZ or from `DISCORD_GUILD_ID_MNKY_VERSE`). Canonical guild ID for MNKY|VERSE: `1069695816001933332` (set from .env.tmp; see [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md)).

## 1. Current implementation summary

### 1.1 Credentials and configuration

| Credential / config | Purpose |
|---------------------|--------|
| `DISCORD_BOT_TOKEN_MNKY_VERSE` | Bot token for Discord API (server-side only). Used by `lib/discord/api.ts`. |
| `MOODMNKY_API_KEY` | Required for `POST /api/discord/events` (ingest Discord events from bot or external service). |
| `NEXT_PUBLIC_DISCORD_INVITE_URL` | Public invite link; shown in Dojo Community and Verse (e.g. "Join Discord"). |
| `DISCORD_GUILD_ID_MNKY_VERSE` | Optional. Default guild for server-side jobs (drop webhooks, scheduled messages). Resolve via `pnpm exec dotenv -e .env.local -- node scripts/get-discord-guild-id.mjs` and set in `.env.local` / production. See [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md) for current guild ID. |

Guild (server) selection is **per-request** in LABZ: the Platform → Discord page calls `GET /api/discord/guilds` and the admin picks a guild; subsequent calls pass `guildId` as a query parameter. When `DISCORD_GUILD_ID_MNKY_VERSE` is set, use it as the primary guild for Inngest jobs and automation so announcements target the correct server without LABZ selection.

**Integrations:** **Platform → Integrations** shows Discord as “Configured” when `DISCORD_BOT_TOKEN_MNKY_VERSE` is set (via `GET /api/labz/settings/credentials-status`). Full Discord control (guild picker, webhooks, etc.) remains at **Platform → Discord**.

### 1.2 Backend (Supabase + API)

- **Tables:** `discord_guild_configs`, `discord_webhooks`, `discord_webhook_templates`, `discord_action_logs` (LABZ control panel); `discord_event_ledger` (events from bot for XP/quests). See migrations `20260220000000_discord_control_panel.sql`, `20260220140000_gamification_ugc_tables.sql`.
- **Events ingestion:** `POST /api/discord/events` (body: `profileId`, `discordUserId`, `guildId`, `channelId?`, `eventType`, `eventRef?`, `value?`). Valid `eventType`: `joined`, `message`, `reaction`, `voice_minutes`, `attachment_posted`, `thread_reply`. Requires `MOODMNKY_API_KEY`. Events are sent to Inngest `discord/event.received` → written to `discord_event_ledger` → trigger `quest/evaluate`.
- **LABZ Discord panel:** `/platform/discord` — guild picker, then tabs: Messages, Forums, Webhooks (stored + execute), Embed builder, Members, Roles, Moderation, Audit logs. All use `GET /api/discord/*` with `guildId` (and optional `channelId`). Webhook execution and stored webhooks use server-side Discord API or stored encrypted tokens. Backoffice can import existing webhooks by pasting the webhook URL; stored webhooks support Copy URL for reuse.
- **OAuth link (Verse):** `/verse/auth/discord` and `/verse/auth/discord/link` — link Discord account to profile so `profile.discord_user_id` (or linked-accounts table) is set for quest evaluation and role assignment.

### 1.3 Gamification link

- **XP:** `xp_ledger` (source e.g. `quest`, `mnky_verse`, `shopify`); `xp_state` (materialized total/level). Discord events do **not** write XP directly; they trigger **quest** evaluation. When a quest’s rule (e.g. `discord_message`) is satisfied, completion awards XP via `award_xp`.
- **Quests:** `quests` (rule jsonb with `requirements`), `quest_progress`. Inngest `quest/evaluate` runs after `discord/event.received` and other triggers. Requirements can include `discord_message`, `discord_reaction`, etc. (see PRD-Gamification and quest DSL).
- **Rewards:** `rewards`, `reward_claims` — e.g. Discord roles by level (future); discount codes; early access.

## 2. MNKY BOX and seasonal drops

- **Drop announcement:** Use LABZ Platform → Discord → Webhooks: create or use a stored webhook for a channel (e.g. `#drops` or `#announcements`). When a new issue is published or a “drop” is launched, call `POST /api/discord/webhooks/execute` (or the stored webhook execute endpoint) with an embed (title, description, link to `/verse/drops/[slug]`). Optionally automate via Inngest when `mnky_issues.status` becomes `published` or when a “launch drop” action is triggered from Verse Backoffice.
- **Drop quests:** Create quests in `quests` with rule requiring e.g. `read_issue` (issue_slug), `mag_quiz`, and `discord_message` or `discord_reaction`. Link quest to `mnky_seasons` via `season_id` if desired. When users complete the quest, they get XP and optionally a reward (e.g. “Members-Only” badge or early access). Use existing `quest/evaluate` and `award_xp`; no new tables.
- **Free-tier and members:** The box CTA “Unlock Members Access” → `/verse` supports a free-tier narrative: sign up (Verse account) and link Discord to access drops and community. No schema change; optional future: explicit tier (free vs member) and gating by tier using `rewards` and level.

## 3. One comprehensive integration plan (prioritized)

### Phase A — Keep and document (current)

1. **Credentials:** Keep `DISCORD_BOT_TOKEN_MNKY_VERSE` and `MOODMNKY_API_KEY`; add optional `DISCORD_GUILD_ID_MNKY_VERSE` for default guild in server-side jobs (announcements, scheduled messages).
2. **LABZ:** Keep Platform → Discord (guild picker + all tabs). Document in this file and in LABZ onboarding that the first guild in the list (or the one matching `DISCORD_GUILD_ID_MNKY_VERSE`) is the “primary” MOOD MNKY server.
3. **Events:** Keep `POST /api/discord/events` and Inngest `discord/event.received` → `discord_event_ledger` → `quest/evaluate`. Ensure the Discord bot (or bridge) sends events with `profileId` resolved from `discord_user_id` (via profile link). If the bot does not have profile IDs, add a small service that looks up profile by `discord_user_id` before calling the API.
4. **Verse:** Keep OAuth link at `/verse/auth/discord/link` and Community/Dojo links (Join Discord, Link Discord account). Ensure linked profile is used for quests and XP.

### Phase B — MNKY BOX + drops

1. **Announce drops:** In Verse Backoffice (manga issue publish) or a dedicated “Launch drop” action, optionally trigger an Inngest job that posts to a Discord webhook (embed with title, lore snippet, link to `https://<verse>/verse/drops/<slug>`). Store webhook for “drops” channel in `discord_webhooks` or use a template in `discord_webhook_templates`.
2. **Drop quests:** Add quests (e.g. “Summer Drop Explorer”) with rules referencing `read_issue`, `mag_quiz`, and `discord_message`/`discord_reaction`. Award XP on completion; optionally issue a reward (e.g. `rewards` row with type `digital_badge` or `early_access`). Example quest (create in Verse Backoffice or seed): title “Drop Explorer”, rule `{ "requirements": [ { "type": "read_issue", "issueId": "<issue_id>" }, { "type": "discord_message", "count": 1 } ], "xpReward": 100 }`; ensure `quests.active = true` and link to a season via `season_id` if desired.
3. **Free-tier:** Use box CTA “Unlock Members Access” → `/verse`; on Verse landing, surface “Join free” and “Link Discord” so users can participate in drop quests and community without a paid tier.

### Phase C — Deeper app-wide integration (future)

1. **Default guild:** Use `DISCORD_GUILD_ID_MNKY_VERSE` in Inngest and server-side scripts so announcements and role updates target the correct server without LABZ selection. Implemented: `getDefaultGuildId()` is used in the `discordDropAnnounce` Inngest function.
2. **Roles by level (future):** When `xp_state.level` crosses a threshold, trigger an Inngest job that calls Discord API to add/remove a role (e.g. “Scent Runner” at level 5). Respect Discord rate limits; use Inngest throttle. Not yet implemented; add when role IDs and level thresholds are defined.
3. **Discord MCP:** Use the project’s Discord MCP for ad-hoc server inspection: `discord_get_server_info({ "guildId": "<your_guild_id>" })` to list channels and member count when writing docs or configuring webhooks. Guild ID can be read from LABZ (select guild, copy ID from network tab or from a stored config) or from `discord_guild_configs` if you store it there.
4. **Profile linkage:** Ensure `profiles.discord_user_id` (or equivalent in linked-accounts) is set by the Verse Discord OAuth link and is used when ingesting events and when evaluating `requires_discord_link` quests.

### Phase D — Agent Bots (MOOD, SAGE, CODE)

1. **Location:** `services/discord-bots/` — Redis + three bots (mood-mnky-bot, sage-mnky-bot, code-mnky-bot). See [DISCORD-BOTS-SETUP.md](DISCORD-BOTS-SETUP.md).
2. **Credentials:** Three Discord applications in the Developer Portal; one bot token per agent. Tokens stored in Notion Credentials and copied to env (`MOOD_MNKY_DISCORD_BOT_TOKEN`, `SAGE_MNKY_DISCORD_BOT_TOKEN`, `CODE_MNKY_DISCORD_BOT_TOKEN`). Runtime uses env only (no live Notion fetch).
3. **Web app APIs:** Bots call `GET /api/discord/profile-by-discord-id` (resolve Discord user → profile), `POST /api/discord/events` (gamification), and `POST /api/discord/agent-reply` (single-turn agent reply). All require `MOODMNKY_API_KEY`.
4. **Slash commands:** MOOD: `/mood`, `/scent`, `/blend`, `/verse`; SAGE: `/sage`, `/reflect`, `/learn`, `/dojo`; CODE: `/code`, `/deploy`, `/pr`, `/lab`. Commands are registered on bot ready.
5. **Redis:** Rate limiting per user/guild; optional conversation cache. Compose stack includes `redis` service.

## 4. Endpoints and MCP quick reference

| What | Endpoint / MCP | Auth |
|------|----------------|------|
| List guilds | `GET /api/discord/guilds` | LABZ admin (requireDiscordAdmin) |
| List channels | `GET /api/discord/channels?guildId=` | LABZ admin |
| Ingest event | `POST /api/discord/events` | `MOODMNKY_API_KEY` |
| Profile by Discord ID | `GET /api/discord/profile-by-discord-id?discordUserId=` | `MOODMNKY_API_KEY` |
| Agent reply (bots) | `POST /api/discord/agent-reply` (body: agentSlug, message, …) | `MOODMNKY_API_KEY` |
| Stored webhooks | `GET/POST /api/discord/webhooks/stored?guildId=` | LABZ admin |
| Execute webhook | `POST /api/discord/webhooks/execute` (body: webhook id or url + payload) | LABZ admin |
| Server info (channels, member count) | **Discord MCP** `discord_get_server_info` with `guildId` | MCP config |

## 5. Server map and onboarding

- **Server map:** [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md) — Categories, channels, guild ID, and MNKY categories. Refresh with `pnpm exec dotenv -e .env.local -- node scripts/fetch-discord-server-map.mjs` (output can be pasted into the doc).
- **Onboarding:** Use the “Welcome to MOOD🖤MNKY!” category and #welcome-and-rules (or a dedicated #start-here) as the first stop for new members. Pin a welcome message (copy in [DISCORD-ONBOARDING.md](DISCORD-ONBOARDING.md)) that states server purpose, links to MNKY VERSE / Dojo and “Link Discord” for quests, and points to MNKY LABZ / MNKY VERSE / MNKY MAIN. Enable Discord’s **Community Onboarding** (default channels + customization questions) and **Rules Screening** in Server Settings. Full recommendations in [DISCORD-DEEP-RESEARCH-REPORT.md](DISCORD-DEEP-RESEARCH-REPORT.md).

## 6. References

- [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md) — Server map and MNKY categories
- [DISCORD-ONBOARDING.md](DISCORD-ONBOARDING.md) — Welcome message copy and onboarding checklist
- [DISCORD-BRAND-ALIGNMENT.md](DISCORD-BRAND-ALIGNMENT.md) — Brand and community alignment (voice, roles, server description)
- [DISCORD-DEEP-RESEARCH-REPORT.md](DISCORD-DEEP-RESEARCH-REPORT.md) — Deep research (onboarding, brand, app integration)
- [DISCORD-INTEGRATION-EXECUTION-REPORT.md](DISCORD-INTEGRATION-EXECUTION-REPORT.md) — Execution report and implementation checklist
- [PRD-Gamification-MNKY-VERSE.md](PRD-Gamification-MNKY-VERSE.md)
- [MNKY-BOX-EDITORIAL-REFINED.md](MNKY-BOX-EDITORIAL-REFINED.md)
- [supabase/migrations/20260220000000_discord_control_panel.sql](supabase/migrations/20260220000000_discord_control_panel.sql)
- [supabase/migrations/20260220140000_gamification_ugc_tables.sql](supabase/migrations/20260220140000_gamification_ugc_tables.sql)
- [apps/web/lib/discord/api.ts](apps/web/lib/discord/api.ts)
- [apps/web/lib/inngest/functions.ts](apps/web/lib/inngest/functions.ts) — `discordEventReceived`, `questEvaluate`
