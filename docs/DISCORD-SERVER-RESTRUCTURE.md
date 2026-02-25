# Discord Server Restructure — First Pass

This document describes the first-pass restructure of the MNKY|VERSE Discord server to align with the full ecosystem (Main, Dojo/Verse, LABZ, Shop, gamification, Shopify, blog, gaming). It includes the rationale, proposed category and channel map, official onboarding flow, integration touchpoints, and bot roles.

## Rationale

Discord is the **primary community communication platform** for MOOD MNKY. This restructure:

- Aligns Discord categories and channels with app surfaces: **MNKY MAIN** (brand), **MNKY VERSE** (storefront, drops, quests, Dojo), **MNKY LABZ** (Blending Lab, formulas, glossary), **MNKY SHOP** (store, rewards, orders).
- Populates the previously empty **MNKY MAIN**, **MNKY VERSE**, and **MNKY LABZ** categories so that links from the web app (Main community, Dojo/Verse community, LABZ) point to real channels.
- Defines an **official onboarding flow** (invite → default channels → rules screening → pinned welcome → link Discord in app).
- Documents **integration touchpoints** (Shopify, blog/drops, gamification, web app) and **admin/locked** channels for bot testing and staff.

## Proposed category and channel map

### Channels created in this pass

| Category | Channels | Purpose |
|----------|----------|---------|
| **MNKY MAIN** | #community-hub, #announcements-main | Cross-ecosystem and brand; link from Main community page. |
| **MNKY VERSE** | #drops, #verse-blog, #quests, #dojo | Drops (webhook target for drop announce), blog, quests/XP, Dojo; link from Dojo/Verse community and bot replies. |
| **MNKY LABZ** | #blending-lab, #formulas, #glossary, #fragrance-oils | Blending Lab, formulas, glossary, fragrance data; tie to LABZ dashboard and MOOD/CODE bot hints. |

### Categories and channels kept as-is

| Category | Notes |
|----------|--------|
| **Welcome to MOOD MNKY!** | #welcome-and-rules, #announcements, #resources — canonical onboarding entry. |
| **MNKY SHOP** | Forum, general, live-chat, rewards, orders, system-status — align with app and Shopify. |
| **MNKY AGENTS** | mood, sage, code, coolify, chat, mnky-docs, eleven-labs; MNKY VERSE bot uses same category (no separate #verse-concierge required). |
| **Gaming** | Palworld only (#live-server, #pal-mnky). POKÉ MNKY and KINK IT move to **MNKY Apps** in Phase 2. |
| **Voice / Design Corner / MNKY MEDIA / MNKY_MIND_DB** | No structural change. |

### Admin and locked channels

Apply permission overwrites in Discord so only Admin/Staff role can view:

- **#moderator-only** (Uncategorized)
- **#bot-command-testing** (Text Channels and Building/Testing — two channels)
- **Building/Testing** category (entire category: #bot-command-testing, #crue-reports, #typeform, #stripe-api)

**Steps:** Server Settings → select channel (or category) → Permissions → Add members or roles → add your Admin/Staff role with “View channel” allowed; add overwrite for @everyone with “View channel” denied. Repeat for each channel or set the overwrite on the Building/Testing category to apply to all children.

See [DISCORD-ONBOARDING.md](DISCORD-ONBOARDING.md) for rules and welcome copy.

### Roles and permissions

User roles (Member, Verse, Blender, Shop, DevOps, tiered subscribers, Moderator, Admin/Builder) and how they gate channel access are defined in [DISCORD-ROLES-AND-ONBOARDING.md](DISCORD-ROLES-AND-ONBOARDING.md). That doc also describes the full onboarding flow, the "What brings you here?" customization prompt and its option→role mapping, and what is automated vs manual. Create roles in Server Settings → Roles (or via API), then set permission overwrites per category as needed.

## Official onboarding flow (first pass)

1. **Invite** — User joins via `NEXT_PUBLIC_DISCORD_INVITE_URL` (from Main, Dojo, or Verse community pages).
2. **Discord Community Onboarding** — Default channels: #welcome-and-rules (or #start-here), #announcements, #general (and optionally #resources). Customization questions: e.g. “What brings you here?” → Fragrance / Blending Lab / Drops and quests / MNKY SHOP / Just browsing — map answers to role or channel access if desired.
3. **Rules screening** — Server Settings → Safety → Rules Screening; use copy from [DISCORD-ONBOARDING.md](DISCORD-ONBOARDING.md).
4. **Pinned welcome message** — In #welcome-and-rules (or #start-here): short intro, “What’s here” (MNKY VERSE, MNKY LABZ, MNKY SHOP), “First steps” (read rules, introduce in #general, **link Discord in the app** for quests/XP, explore app). Include: **Use slash commands: /verse for the Dojo and drops, /mood for fragrance, /sage for learning, /code for dev and LABZ.**
5. **In-app** — Dojo/Verse Community page: “Join Discord” + “Link Discord account”; Main community: “Join Discord server”. Linking stores `profiles.discord_user_id` so slash commands and activity count toward quests and XP.

Full welcome message and rules copy: [DISCORD-ONBOARDING.md](DISCORD-ONBOARDING.md).

## Integration touchpoints

| Integration | Discord side | App / backend |
|-------------|--------------|---------------|
| **Shopify** | #orders (support), #rewards (catalog), #system-status | Order webhooks → XP; rewards from `rewards` table; status from app or manual. |
| **Blog / drops** | #verse-blog, #drops | Drop announce Inngest → webhook to #drops; blog links in pinned message and Verse bot. |
| **Gamification** | #quests, any channel for slash/activity | Bots send `POST /api/discord/events` → `discord_event_ledger` → quest/evaluate; “Link Discord” in app. |
| **Web app / Dojo** | Community links in welcome + every MNKY category | NEXT_PUBLIC_DISCORD_INVITE_URL; Dojo/Verse community pages; LABZ Platform → Discord. |
| **Gaming** | Palworld (#live-server, #pal-mnky) | No app automation required; optional future: game-specific roles or announcements. |
| **MNKY Apps** (Phase 2) | #poke-mnky, #kink-it | In-development products (POKÉ MNKY, KINK IT); announcements moved from legacy categories. |

## Bot roles and slash commands

| Bot | Purpose | Slash commands |
|-----|---------|----------------|
| **MOOD MNKY** | Brand, fragrance, scent, blend | /mood, /scent, /blend, /verse |
| **SAGE MNKY** | Learning, reflection, Dojo | /sage, /reflect, /learn, /dojo |
| **CODE MNKY** | Tech, LABZ, deploy, PR | /code, /deploy, /pr, /lab |
| **MNKY VERSE** | Concierge: Verse/Dojo, drops, quests, rewards | /verse, /drops, /quests, /rewards, /dojo, /ask |

See [DISCORD-MNKY-VERSE-BOT-DESIGN.md](DISCORD-MNKY-VERSE-BOT-DESIGN.md) for MNKY VERSE bot design.

## Phase 2: MNKY Apps category (in-development products)

POKÉ MNKY and KINK IT are **apps in development** (not games). Phase 2:

1. **Add category:** "MNKY Apps" (aligns with MNKY MAIN, MNKY VERSE, MNKY LABZ).
2. **Move and rename:** POKÉ MNKY #announcements → **#poke-mnky**; KINK IT #announcements → **#kink-it** (under MNKY Apps; avoids duplicate "announcements").
3. **Gaming** remains for Palworld only (#live-server, #pal-mnky).

### Recommended names

| Item | Name |
|------|------|
| Category | **MNKY Apps** |
| POKÉ MNKY channel | **poke-mnky** |
| KINK IT channel | **kink-it** |

### Discord API operations (guild ID: 1069695816001933332)

1. **Create category (type 4)**  
   `POST https://discord.com/api/v10/guilds/1069695816001933332/channels`  
   Body: `{"name":"MNKY Apps","type":4}`  
   → Use returned `id` as `parent_id` below.

2. **Move POKÉ MNKY announcements**  
   `PATCH https://discord.com/api/v10/channels/1455487289814945899`  
   Body: `{"parent_id":"<newCategoryId>","name":"poke-mnky"}`

3. **Move KINK IT announcements**  
   `PATCH https://discord.com/api/v10/channels/1457594125590462548`  
   Body: `{"parent_id":"<newCategoryId>","name":"kink-it"}`

**Run the script:**  
`pnpm exec dotenv -e .env.local -- node scripts/discord-phase2-apps-category.mjs [guildId]`  
Requires `DISCORD_BOT_TOKEN_MNKY_VERSE` in `.env.local`.

### Phase 2 (full): Gaming, #rules, welcome embed

- **Gaming category:** Create "Gaming", move Palworld channels (#live-server, #pal-mnky) into it. Script: `scripts/move-discord-channels-phase2.mjs`.
- **#rules:** Move from Uncategorized to "Welcome to MOOD MNKY!" (same script).
- **Welcome embed:** Post a rich embed to #welcome-and-rules and pin it. Script: `scripts/post-discord-welcome-embed.mjs`. See [DISCORD-ONBOARDING.md](DISCORD-ONBOARDING.md) (Embed welcome message).
- **Onboarding (optional):** Set default channels and enable Community Onboarding via `scripts/set-discord-onboarding.mjs`; see [DISCORD-PHASE2-WALKTHROUGH.md](DISCORD-PHASE2-WALKTHROUGH.md).
- **Walkthrough:** Full order of operations and manual steps are in [DISCORD-PHASE2-WALKTHROUGH.md](DISCORD-PHASE2-WALKTHROUGH.md).

## How to refresh the server map

After creating or moving channels:

```bash
pnpm exec dotenv -e .env.local -- node scripts/fetch-discord-server-map.mjs 1069695816001933332
```

Paste the output into [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md) (replace the “Categories and channels” section), or redirect to the file. You can also use the **Discord MCP** `discord_get_server_info` with `guildId: 1069695816001933332` to inspect channels and categories.

## References

- [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md) — Categories, channels, guild ID.
- [DISCORD-PHASE2-WALKTHROUGH.md](DISCORD-PHASE2-WALKTHROUGH.md) — Phase 2 order of operations and manual steps.
- `scripts/discord-phase2-apps-category.mjs` — Phase 2: create MNKY Apps category and move #poke-mnky, #kink-it.
- `scripts/move-discord-channels-phase2.mjs` — Phase 2: create Gaming, move Palworld channels, move #rules to Welcome.
- `scripts/post-discord-welcome-embed.mjs` — Post and pin the welcome embed in #welcome-and-rules.
- `scripts/set-discord-onboarding.mjs` — Set onboarding enabled and default channels (#welcome-and-rules, #announcements, #general).
- `scripts/delete-discord-empty-categories-phase2.mjs` — Optional: delete empty categories Palworld, POKÉ MNKY, KINK IT after Phase 2 moves.
- [DISCORD-ONBOARDING.md](DISCORD-ONBOARDING.md) — Welcome message, rules, onboarding checklist.
- [DISCORD-INTEGRATION-PLAN.md](DISCORD-INTEGRATION-PLAN.md) — Credentials, endpoints, Phase E (restructure).
- [DISCORD-MNKY-VERSE-BOT-DESIGN.md](DISCORD-MNKY-VERSE-BOT-DESIGN.md) — MNKY VERSE bot role and commands.
- [PRD-Gamification-MNKY-VERSE.md](PRD-Gamification-MNKY-VERSE.md) — XP, quests, Discord events.
