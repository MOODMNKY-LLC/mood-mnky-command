# Discord Server Map: MNKY|VERSE

This document is the canonical map of the MOOD MNKY Discord server (MNKY|VERSE). It is used for onboarding design, MNKY category structure, and app integration (MNKY LABZ default guild, drop webhooks, quest channel references).

## How to refresh this map

From the repo root with `DISCORD_BOT_TOKEN_MNKY_VERSE` and optionally `NEXT_PUBLIC_DISCORD_INVITE_URL` in `.env.local`:

```bash
pnpm exec dotenv -e .env.local -- node scripts/fetch-discord-server-map.mjs > docs/DISCORD-SERVER-MAP.md
```

Or pass the guild ID explicitly:

```bash
pnpm exec dotenv -e .env.local -- node scripts/fetch-discord-server-map.mjs 1069695816001933332 >> docs/DISCORD-SERVER-MAP.md
```

To only resolve the guild ID (e.g. for `DISCORD_GUILD_ID_MNKY_VERSE`):

```bash
pnpm exec dotenv -e .env.local -- node scripts/get-discord-guild-id.mjs
```

---

| Field | Value |
|-------|-------|
| Guild ID | `1069695816001933332` |
| Approx. members | 52 |

## Categories and channels

### Welcome to MOOD🖤MNKY! (category)

| Channel | Type | ID |
|---------|------|-----|
| #welcome-and-rules | text | `1069695816966615183` |
| #announcements | text | `1069695816966615184` |
| #resources | text | `1069695816966615185` |

### Palworld (category)

| Channel | Type | ID |
|---------|------|-----|
| #live-server | text | `1231960400996597832` |
| #pal-mnky | text | `1233533463261352029` |

### Voice Channels (category)

| Channel | Type | ID |
|---------|------|-----|
| #Lounge | voice | `1069695816966615191` |
| #Meeting Room | voice | `1069695817268609164` |

### Text Channels (category)

| Channel | Type | ID |
|---------|------|-----|
| #general | text | `1069695816966615187` |
| #meeting-plans | text | `1069695816966615188` |
| #off-topic | text | `1069695816966615189` |
| #bot-command-testing | text | `1081875586760331365` |
| #test | text | `1082012170193227947` |
| #feedback-chat | text | `1096081589395529839` |

### MNKY SHOP (category)

| Channel | Type | ID |
|---------|------|-----|
| #community-forum | forum | `1081418862572097606` |
| #general | text | `1081418924765229196` |
| #community-section-ideas | text | `1081419085675507773` |
| #product-theme-ideas | text | `1081419174359871529` |
| #webstore-ideas | text | `1081419279649480794` |
| #live-chat | text | `1082932541125836830` |
| #customization-corner | text | `1083514982769119252` |
| #rewards | text | `1083515206690406421` |
| #orders | text | `1458780938182852679` |
| #system-status | text | `1458781300101091541` |

### Design Corner (category)

| Channel | Type | ID |
|---------|------|-----|
| #web-designs | text | `1106674887164166355` |
| #label-designs | text | `1106674927223975986` |
| #logo-designs | text | `1106675004432720012` |
| #random-test | text | `1106675051153084447` |
| #test-kitchen | text | `1119797353130500130` |
| #nadias-playground | text | `1149366980894265435` |

### MNKY AGENTS (category)

| Channel | Type | ID |
|---------|------|-----|
| #mood-mnky-va | text | `1178456136089870459` |
| #sage-mnky-va | text | `1236037949104066610` |
| #code-mnky-ai | text | `1236042013179248761` |
| #coolify-updates | text | `1258748107038920704` |
| #chat-moodmnky | text | `1265045498742575125` |
| #mnky-docs | text | `1347261241307172944` |
| #mood-mind | text | `1356404443486224427` |
| #eleven-labs | text | `1474988660981235824` |

### Building/Testing (category)

| Channel | Type | ID |
|---------|------|-----|
| #bot-command-testing | text | `1082118648623280249` |
| #crue-reports | text | `1082118697914748939` |
| #typeform | text | `1083622658022846484` |
| #stripe-api | text | `1284569267647418388` |

### MNKY MEDIA (category)

| Channel | Type | ID |
|---------|------|-----|
| #jellyfin-updates | text | `1251201638551654533` |
| #jellyseer | text | `1302375280060534825` |
| #lidarr | text | `1303490865079128127` |

### MNKY_MIND_DB (category)

| Channel | Type | ID |
|---------|------|-----|
| #updates | text | `1356403019805364284` |

### POKÉ MNKY🐵 (category)

| Channel | Type | ID |
|---------|------|-----|
| #announcements | announcement | `1455487289814945899` |

### KINK IT (category)

| Channel | Type | ID |
|---------|------|-----|
| #announcements | text | `1457594125590462548` |

### MNKY LABZ (category)

*No channels in this category.*

### MNKY VERSE (category)

*No channels in this category.*

### MNKY MAIN (category)

*No channels in this category.*

### Uncategorized

| Channel | Type | ID |
|---------|------|-----|
| #moderator-only | text | `1078917875605192765` |
| #rules | text | `1078917875605192764` |
| #mood-mnky-media | type-16 | `1121495285097562222` |

---

## MNKY categories summary

Categories whose names contain "MNKY" and their intended use (for onboarding and app integration):

| Category | Channels | Suggested focus |
|----------|----------|------------------|
| **Welcome to MOOD🖤MNKY!** | #welcome-and-rules, #announcements, #resources | First stop for new members; rules and announcements. |
| **MNKY SHOP** | Community forum, general, ideas, live-chat, rewards, orders, system-status | Store and product community; rewards and orders. |
| **MNKY AGENTS** | VA, Sage, Code MNKY, Coolify, chat, mnky-docs, mood-mind, Eleven Labs | AI/automation and internal tooling. |
| **MNKY MEDIA** | Jellyfin, Jellyseer, Lidarr | Media stack updates. |
| **MNKY_MIND_DB** | #updates | Database/backend updates. |
| **POKÉ MNKY🐵** | #announcements | Game/community announcements. |
| **MNKY LABZ** | *(empty)* | **Populate:** Blending Lab, formulas, fragrance oils, glossary (MNKY LABZ dashboard). |
| **MNKY VERSE** | *(empty)* | **Populate:** Verse storefront, blog, drops, quests, Dojo. |
| **MNKY MAIN** | *(empty)* | **Populate:** Main site, community hub, Discord invite. |

Empty MNKY LABZ, MNKY VERSE, and MNKY MAIN categories are placeholders for the brand/community overhaul: add channels (e.g. #drops, #blending-lab, #verse-blog) and link from the app (Verse community page, Dojo, MNKY LABZ).

### Populating MNKY LABZ, MNKY VERSE, MNKY MAIN

Use the following as a checklist when adding channels. Create them via MNKY LABZ Platform → Discord (Messages / channel list) or the Discord MCP (`discord_create_text_channel` with the appropriate `guildId` and `parent_id` for the category).

| Category | Suggested channels | Purpose |
|----------|---------------------|---------|
| **MNKY LABZ** | #blending-lab, #formulas, #glossary, #fragrance-oils | Blending Lab, formulas, glossary, and fragrance data discussion; ties to MNKY LABZ dashboard. |
| **MNKY VERSE** | #drops, #verse-blog, #quests, #dojo | Drops and seasonal releases; MNKY VERSE blog; quests and XP; Dojo (member hub). Link from Verse community page. |
| **MNKY MAIN** | #community-hub, #announcements-main | Main site community hub; cross‑ecosystem announcements. Link from main community page. |

After creating channels, set channel topics (one line) where helpful (e.g. “Seasonal drops and MNKY BOX” for #drops). Refresh the server map with `scripts/fetch-discord-server-map.mjs` and update this doc if needed.

## References

- [DISCORD-INTEGRATION-PLAN.md](DISCORD-INTEGRATION-PLAN.md) — Credentials, endpoints, drop webhooks, quests.
- [PRD-Gamification-MNKY-VERSE.md](PRD-Gamification-MNKY-VERSE.md) — XP, quests, Discord events.
