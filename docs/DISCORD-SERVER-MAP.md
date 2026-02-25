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

### Role IDs (for API use)

When roles are created (Member, Verse, Blender, Shop, DevOps, Subscriber, Dojo Member, MOOD Insider, Moderator, Admin/Builder), record their Discord role IDs here for onboarding prompts and level→role sync. See [DISCORD-ROLES-AND-ONBOARDING.md](DISCORD-ROLES-AND-ONBOARDING.md). Until then, leave this section empty or populate after running role-creation in Server Settings or via API.

| Role | ID |
|------|-----|
| *(to be filled)* | — |

## Categories and channels

### Welcome to MOOD🖤MNKY! (category)

| Channel | Type | ID |
|---------|------|-----|
| #rules | text | `1078917875605192764` |
| #welcome-and-rules | text | `1069695816966615183` |
| #announcements | text | `1069695816966615184` |
| #resources | text | `1069695816966615185` |

### Palworld (category)

*No channels in this category.* (Channels moved to **Gaming** in Phase 2.)

### Gaming (category)

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

*No channels in this category.* (Moved to **MNKY Apps** in Phase 2.)

### KINK IT (category)

*No channels in this category.* (Moved to **MNKY Apps** in Phase 2.)

### MNKY Apps (category)

| Channel | Type | ID |
|---------|------|-----|
| #poke-mnky | announcement | `1455487289814945899` |
| #kink-it | text | `1457594125590462548` |

### MNKY LABZ (category)

| Channel | Type | ID |
|---------|------|-----|
| #blending-lab | text | `1476292693792653314` |
| #formulas | text | `1476292695788880034` |
| #glossary | text | `1476292697101963335` |
| #fragrance-oils | text | `1476292702344839305` |

### MNKY VERSE (category)

| Channel | Type | ID |
|---------|------|-----|
| #drops | text | `1476292688805363813` |
| #verse-blog | text | `1476292690004934818` |
| #quests | text | `1476292691141722247` |
| #dojo | text | `1476292692727038193` |

### MNKY MAIN (category)

| Channel | Type | ID |
|---------|------|-----|
| #community-hub | text | `1476292685626343435` |
| #announcements-main | text | `1476292687177973780` |

### Uncategorized

| Channel | Type | ID |
|---------|------|-----|
| #moderator-only | text | `1078917875605192765` |
| #mood-mnky-media | type-16 | `1121495285097562222` |

---

## Category IDs (for API / parent_id)

| Category name | Category ID |
|--------------|-------------|
| Welcome to MOOD🖤MNKY! | `1069695816966615182` |
| Palworld | `1231960241147744266` |
| Voice Channels | `1069695816966615190` |
| Text Channels | `1069695816966615186` |
| MNKY SHOP | `1081418807974842388` |
| Design Corner | `1106674679265103912` |
| MNKY AGENTS | `1236037835619041400` |
| Building/Testing | `1082118576057626645` |
| MNKY MEDIA | `1251201572902535309` |
| MNKY_MIND_DB | `1356402839840362518` |
| POKÉ MNKY🐵 | `1455487195493171260` |
| KINK IT | `1457594042333396993` |
| MNKY LABZ | `1475405415624867850` |
| MNKY VERSE | `1475405789475766433` |
| MNKY MAIN | `1475405844295323699` |
| MNKY Apps | `1476298635468865616` |
| Gaming | `1476298657547682033` |

---

## MNKY categories summary

Categories whose names contain "MNKY" and their intended use (for onboarding and app integration):

| Category | Channels | Suggested focus |
|----------|----------|------------------|
| **Welcome to MOOD🖤MNKY!** | #rules, #welcome-and-rules, #announcements, #resources | First stop for new members; rules and announcements. (#rules moved here in Phase 2.) |
| **MNKY SHOP** | Community forum, general, ideas, live-chat, rewards, orders, system-status | Store and product community; rewards and orders. |
| **MNKY AGENTS** | VA, Sage, Code MNKY, Coolify, chat, mnky-docs, mood-mind, Eleven Labs | AI/automation and internal tooling. |
| **MNKY MEDIA** | Jellyfin, Jellyseer, Lidarr | Media stack updates. |
| **MNKY_MIND_DB** | #updates | Database/backend updates. |
| **MNKY Apps** | #poke-mnky, #kink-it | In-development products (POKÉ MNKY, KINK IT). Phase 2. |
| **MNKY LABZ** | #blending-lab, #formulas, #glossary, #fragrance-oils | Blending Lab, formulas, glossary; MNKY LABZ dashboard. |
| **MNKY VERSE** | #drops, #verse-blog, #quests, #dojo | Drops (webhook target), blog, quests/XP, Dojo. Link from Verse community page. |
| **MNKY MAIN** | #community-hub, #announcements-main | Main site community hub; cross‑ecosystem announcements. |

**Restructure first pass (done):** MNKY MAIN, MNKY VERSE, and MNKY LABZ were populated per [DISCORD-SERVER-RESTRUCTURE.md](DISCORD-SERVER-RESTRUCTURE.md).

**Phase 2 (done):** MNKY Apps category (#poke-mnky, #kink-it), Gaming category (#live-server, #pal-mnky), #rules moved to Welcome, welcome embed posted and pinned. See [DISCORD-PHASE2-WALKTHROUGH.md](DISCORD-PHASE2-WALKTHROUGH.md). Empty categories Palworld, POKÉ MNKY, KINK IT can be deleted manually in Discord if desired.

Refresh the map with `scripts/fetch-discord-server-map.mjs 1069695816001933332`.

## References

- [DISCORD-SERVER-RESTRUCTURE.md](DISCORD-SERVER-RESTRUCTURE.md) — First-pass restructure (MAIN, VERSE, LABZ), Phase 2 (MNKY Apps, Gaming, welcome embed).
- [DISCORD-PHASE2-WALKTHROUGH.md](DISCORD-PHASE2-WALKTHROUGH.md) — Phase 2 scripts and manual steps.
- [DISCORD-INTEGRATION-PLAN.md](DISCORD-INTEGRATION-PLAN.md) — Credentials, endpoints, drop webhooks, quests.
- [PRD-Gamification-MNKY-VERSE.md](PRD-Gamification-MNKY-VERSE.md) — XP, quests, Discord events.
