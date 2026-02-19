# PRD: Gamification (MNKY VERSE)

## Overview and objectives

The MNKY VERSE gamification system is a behavior-driven progression layer that turns the MOOD MNKY ecosystem into a cohesive world. Customers earn XP for meaningful actions (purchases, reviews, blend creation, reading manga chapters, passing quizzes, UGC submissions, and Discord participation). XP increases level, which unlocks early access to drops, discount tiers, members-only products, Discord roles, and digital collectibles. The system is ledger-based (append-only XP ledger and materialized XP state), with quests and rewards defined as data and evaluated server-side. The canonical source of truth is Supabase (MNKY MIND); Shopify remains the commerce layer; Next.js (mood-mnky-command) is the control plane and API.

## Target audience

- **Primary:** Shoppers and community members who engage with MOOD MNKY (store, Verse, Discord). They want recognition, status, and tangible rewards (early access, discounts, badges).
- **Secondary:** Merchants and operators who configure XP rules, quests, and rewards via the LABZ dashboard (Verse Backoffice).

## Core features and functionality

- **XP ledger and state:** Every award is recorded in `xp_ledger` (profile_id, source, source_ref, xp_delta, reason). `xp_state` holds the materialized total and level per profile. Level is computed by the database function `compute_level_from_xp(xp_total)` (simple staircase: levels 1–5 at 0, 100, 250, 500, 900 XP, then +500 per level).
- **Award API:** Only server-side code or internal callers with `MOODMNKY_API_KEY` can award XP via `POST /api/xp/award` or the DB function `award_xp`. Clients never write XP directly.
- **Quests:** Quests are stored in `quests` with a rule (JSON) describing requirements and rewards. Progress is tracked in `quest_progress`. Evaluation runs in Inngest after Discord events or other triggers; completion can grant XP and reward claims.
- **Discord integration:** The Discord bot (or external service) posts normalized events to `POST /api/discord/events` (authenticated with `MOODMNKY_API_KEY`). Events are written to `discord_event_ledger` and trigger Inngest jobs for quest evaluation and optional role updates (rate-limited).
- **UGC submissions:** Users upload media (photo/video) and submit with caption. Submissions are stored in `ugc_submissions` with status pending/approved/rejected. Moderation is done in the Verse Backoffice; on approval, XP can be awarded (e.g. via `award_xp` or Inngest `ugc/on.approved`).
- **Rewards and claims:** Rewards are defined in `rewards` (type, payload, min_level or rule). Issued rewards are recorded in `reward_claims`. Redemption (discount codes, Discord roles, early access) is implemented in application logic and/or Inngest.
- **Shopify webhooks:** Orders paid (and optionally cancelled/refunds) are received at `POST /api/shopify/webhooks`, verified with HMAC, and forwarded to Inngest. The `shopify/order.paid` function awards XP based on config (e.g. subtotal tiers) and optionally triggers quest evaluation.

Acceptance criteria for each feature are defined in the implementation: e.g. “Users can view their XP and level via GET /api/xp/state when authenticated”; “UGC approve action in dashboard awards XP once per submission.”

## Technical stack recommendations

- **Backend:** Next.js App Router (mood-mnky-command), Supabase (Postgres, Auth, Storage), Inngest (durable jobs).
- **Validation:** Zod for request/response and Flowise output validation; ts-pattern for rule evaluation where applicable.
- **Discord:** discord.js for the bot; events sent to mood-mnky-command only; role changes and announcements queued via Inngest to respect rate limits.
- **Security:** No secrets in client; Flowise and OpenAI called server-side only; internal tool endpoints protected by `MOODMNKY_API_KEY`.

## Conceptual data model

- **xp_ledger:** id, profile_id, source, source_ref, xp_delta, reason, created_at.
- **xp_state:** profile_id (PK), xp_total, level, updated_at.
- **discord_event_ledger:** id, profile_id, discord_user_id, guild_id, channel_id, event_type, event_ref, value, created_at.
- **quests:** id, external_id, title, description, rule (jsonb), xp_reward, season_id, active, cooldown_days, requires_purchase, requires_discord_link.
- **quest_progress:** profile_id, quest_id, progress (jsonb), completed_at (unique on profile_id, quest_id).
- **rewards:** id, type, payload (jsonb), min_level, rule (jsonb), active.
- **reward_claims:** id, profile_id, reward_id, status (issued/redeemed/revoked), issued_at.
- **ugc_submissions:** id, profile_id, collection_id, type, caption, media_path, media_hash (unique), status, moderation_notes, created_at.

All profile_id fields reference `public.profiles(id)`.

## UI design principles

- **Verse Backoffice (LABZ):** Clear list and detail views for manga issues, XP/quests config, UGC queue, and Discord event log. Use existing design system (shadcn, Tailwind). Moderation actions (approve/reject UGC) are explicit and auditable.
- **Verse storefront:** Quest list and UGC upload are lightweight; XP/level can be shown in a header or profile. No sensitive controls on the client.

## Security considerations

- XP can only be written via server-side `award_xp` or `POST /api/xp/award` with internal API key. No client-writable XP.
- Discord event ingestion and Shopify webhooks require authentication (API key or HMAC). Rate limiting (e.g. @upstash/ratelimit) recommended on public-facing submit endpoints (quiz, UGC presign).
- UGC media is stored in a private bucket; signed URLs or RLS govern access. Moderation is admin-only.

## Development phases / milestones

- **Phase 1 (done):** Schema, Core API (xp, mag, ugc, discord, Flowise tools), Inngest (order.paid, discord/event.received, quest/evaluate, ugc/on.approved), OpenAI modules, Verse Backoffice pages.
- **Phase 2 (done):** Verse storefront routes (issues, quests, UGC) and components (chapter reader with read telemetry, UGC upload).
- **Phase 3 (done):** Theme block (Issue Teaser), App Proxy routes (session, api/issues, api/quests), docs for proxy and metaobjects.
- **Phase 4 (done):** Configurable XP rules (config_xp_rules including mag_read, mag_quiz, mag_download, purchase, ugc_approved; see [MAG-XP-RULES.md](MAG-XP-RULES.md)); full quest DSL evaluation (read_issue, discord_message, purchase, mag_quiz, ugc_approved, xp_source) with quest/evaluate triggered on mag read/quiz/download and UGC approval; rate limiting (Upstash) on mag read-event, quiz, UGC presign; XP rules view in Verse Backoffice.
- **Future:** Discord role automation; reward redemption UI and discount code issuance.

## Potential challenges and solutions

- **Discord rate limits:** All role/announce actions go through Inngest with throttling; bot only sends events to our API.
- **XP abuse:** Read/quiz/download/UGC rules and cooldowns are enforced server-side; ledger is append-only and auditable.
- **Profile linkage:** Shopify customer ID and Discord user ID should be stored on profiles for order→XP and Discord→quest linkage; ensure customer creation/update webhooks or OAuth flows populate these.

## Future expansion possibilities

- Seasons and seasonal resets; level curve tuning via config table.
- Rich reward types (NFTs, physical perks); integration with additional community platforms.
- Public leaderboards and badges; export of XP history for users.
