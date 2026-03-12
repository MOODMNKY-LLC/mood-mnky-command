# Discord Integration Execution Report

This report documents the research themes and implementation checklist for the Discord Guild ID and Integration Plan execution. It supports [DISCORD-INTEGRATION-PLAN.md](DISCORD-INTEGRATION-PLAN.md) and the phased work (Phase A, B, C).

## Theme 1 — Default guild and server-side jobs

The codebase exposes `getDefaultGuildId()` in [apps/web/lib/discord/api.ts](apps/web/lib/discord/api.ts), returning `process.env.DISCORD_GUILD_ID_MNKY_VERSE`. The guild ID from .env.tmp (`1069695816001933332`) has been set in `.env.local` and `.env.production`. Server-side jobs that must target the MNKY VERSE Discord server should call `getDefaultGuildId()` and use it to look up stored webhooks (e.g. in `discord_webhooks` by `guild_id`) or to pass as `guildId` where the Discord API or internal APIs require it. The LABZ Platform → Discord "Primary server" badge uses `GET /api/discord/primary-guild?guildId=` and compares the selected guild to this env value.

## Theme 2 — Drop announcement flow

Trigger: When an issue is set to `status: "published"` via Verse Backoffice (`PATCH /api/verse-backoffice/manga/issues/[id]`), an Inngest event `manga/issue.published` is sent with `issueId`, `slug`, `title`, and optional `arc_summary`. The Inngest function `discordDropAnnounce` listens for this event, resolves the default guild via `getDefaultGuildId()`, looks up a stored webhook in `discord_webhooks` for that guild (preferring one named for drops or announcements), decrypts the token, and POSTs an embed to the Discord webhook with title, description, and link to `/verse/drops/[slug]`. If no webhook is configured for the guild, the function no-ops and does not fail. This allows admins to create and store a webhook in LABZ (Platform → Discord → Webhooks) for the #drops or #announcements channel; once stored, publishing an issue will post the announcement.

## Theme 3 — Quest and event pipeline

Profile linkage: Verse Discord OAuth (`/verse/auth/discord/link`) sets the linked Discord identity; the app stores `discord_user_id` (or equivalent) for the profile so that `POST /api/discord/events` can receive events with `profileId` resolved. The pipeline is already implemented: events are written to `discord_event_ledger` and trigger Inngest `quest/evaluate`. Quest requirements support `discord_message` and `discord_reaction` (see [apps/web/lib/inngest/functions.ts](apps/web/lib/inngest/functions.ts)). No code change was required; documentation in the integration plan and PRD-Gamification already describes this.

## Theme 4 — Discord server state and channels

The Discord MCP can be used with `discord_get_server_info({ "guildId": "1069695816001933332" })` to inspect the MNKY|VERSE server once the MCP is logged in (token configured). The server map in [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md) was produced via `scripts/fetch-discord-server-map.mjs` and lists categories and channels; MNKY VERSE, MNKY LABZ, and MNKY MAIN are currently empty and can be populated via LABZ or MCP `discord_create_text_channel` when desired. No automated channel creation was added; the plan leaves that as an optional step.

## Theme 5 — UI and design alignment

Community and LABZ surfaces (main, Verse, Dojo, Platform → Discord) were previously updated with onboarding copy ("Start in #welcome-and-rules", "Explore MNKY VERSE and MNKY LABZ"). Any new UI in this execution (e.g. Verse Backoffice "Launch drop" button if added) should follow [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) and the design skill (shadcn, existing tokens). No new UI components were added in this execution; the drop announcement is backend-only (Inngest + webhook).

## Implementation checklist (completed)

- [x] Set `DISCORD_GUILD_ID_MNKY_VERSE=1069695816001933332` in `.env.local` and `.env.production`.
- [x] Phase A: Document canonical guild ID in integration plan; Primary server badge already implemented.
- [x] Phase B: Add Inngest event `manga/issue.published` when issue is published from Verse Backoffice; add Inngest function `discordDropAnnounce` using `getDefaultGuildId()` and stored webhook; document example drop quest in docs.
- [x] Phase C: Use `getDefaultGuildId()` in drop-announce job; document roles-by-level as future work; profile linkage confirmed in docs.
- [x] Design: No new UI; existing community pages already aligned.
- [x] Verification: Build and key flows verified.
- [x] Webhooks: Backoffice can import existing webhooks by pasting the webhook URL (Platform → Discord → Webhooks → Import webhook by URL); stored webhooks support Copy URL for reuse.

## References

- [DISCORD-INTEGRATION-PLAN.md](DISCORD-INTEGRATION-PLAN.md)
- [DISCORD-SERVER-MAP.md](DISCORD-SERVER-MAP.md)
- [PRD-Gamification-MNKY-VERSE.md](PRD-Gamification-MNKY-VERSE.md)
