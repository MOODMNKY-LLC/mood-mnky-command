# Discord Phase 2 Walkthrough

This walkthrough covers the Phase 2 changes: MNKY Apps category, Gaming category, #rules under Welcome, and the embed welcome message.

## Prerequisites

- `DISCORD_BOT_TOKEN_MNKY_VERSE` in `.env.local` (repo root or `services/discord-bots/` depending on where you run scripts).
- Optional: `VERSE_APP_URL` or `NEXT_PUBLIC_APP_URL` for live links in the welcome embed thumbnail and text.

## Order of operations

### 1. Create MNKY Apps and move app channels

POKÉ MNKY and KINK IT are apps in development. This script creates the **MNKY Apps** category and moves their announcement channels into it with renames (#poke-mnky, #kink-it).

```bash
pnpm exec dotenv -e .env.local -- node scripts/discord-phase2-apps-category.mjs 1069695816001933332
```

### 2. Create Gaming and move #rules

Creates the **Gaming** category, moves Palworld channels (#live-server, #pal-mnky) into it, and moves **#rules** under **Welcome to MOOD MNKY!**.

```bash
pnpm exec dotenv -e .env.local -- node scripts/move-discord-channels-phase2.mjs 1069695816001933332
```

### 3. Post and pin the welcome embed

Posts a rich embed to #welcome-and-rules (title, description, thumbnail, fields, footer) and pins it.

```bash
pnpm exec dotenv -e .env.local -- node scripts/post-discord-welcome-embed.mjs
```

### 4. Set onboarding defaults (optional script)

Sets Community Server onboarding: enabled, default channels (#welcome-and-rules, #announcements, #general). Preserves existing prompts. Bot needs `MANAGE_GUILD`.

```bash
pnpm exec dotenv -e .env.local -- node scripts/set-discord-onboarding.mjs 1069695816001933332
```

### 5. Manual steps (Discord Server Settings)

- **Rules Screening:** Server Settings → Safety Setup → Rules Screening. Enable and paste the rules text from [DISCORD-ONBOARDING.md](DISCORD-ONBOARDING.md).
- **Community Onboarding:** If you didn’t run the script, set default channels in Server Settings → Onboarding. Customize prompts (e.g. “What brings you here?”) in the same UI.
- **Optional — empty categories:** After channels are moved, delete the now-empty **Palworld**, **POKÉ MNKY**, **KINK IT** categories. Script: `scripts/delete-discord-empty-categories-phase2.mjs` (or delete manually in Discord: channel list → right-click category → Delete Category).

### 6. Refresh the server map

After running the scripts, refresh the canonical server map:

```bash
pnpm exec dotenv -e .env.local -- node scripts/fetch-discord-server-map.mjs 1069695816001933332
```

Replace the "Categories and channels" and "Category IDs" sections in [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md) with the script output, or redirect the command into the doc. Add a short note that Phase 2 (MNKY Apps, Gaming, #rules under Welcome, embed welcome) is done.

## Summary of Phase 2 changes

| Change | Script / action |
|--------|------------------|
| MNKY Apps category + #poke-mnky, #kink-it | `discord-phase2-apps-category.mjs` |
| Gaming category + #live-server, #pal-mnky | `move-discord-channels-phase2.mjs` |
| #rules under Welcome | `move-discord-channels-phase2.mjs` |
| Welcome embed + pin | `post-discord-welcome-embed.mjs` |
| Onboarding defaults (enabled + default channels) | `set-discord-onboarding.mjs` (optional) |
| Rules Screening, prompt customization | Manual in Server Settings |
| Empty category cleanup (optional) | `delete-discord-empty-categories-phase2.mjs` or manual |
| Server map update | `fetch-discord-server-map.mjs` + edit DISCORD-SERVER-MAP.md |

## References

- [DISCORD-SERVER-RESTRUCTURE.md](DISCORD-SERVER-RESTRUCTURE.md) — First pass and Phase 2 (MNKY Apps, Gaming).
- [DISCORD-ONBOARDING.md](DISCORD-ONBOARDING.md) — Welcome copy, embed script, rules text.
- [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md) — Categories and channel IDs.
