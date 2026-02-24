# Gamification Touch Points (MNKY VERSE)

Full inventory of where the XP, quests, rewards, and loyalty system touches the app: database, API routes, background jobs, UI, and Shopify.

---

## 1. Database (Supabase)

### 1.1 Migrations

| File | Purpose |
|------|---------|
| `supabase/migrations/20260220140000_gamification_ugc_tables.sql` | Creates `xp_ledger`, `xp_state`, `discord_event_ledger`, `mnky_seasons`, `rewards`, `reward_claims`, `quests`, `quest_progress`, `ugc_submissions`, `config_xp_rules`; RLS policies |
| `supabase/migrations/20260220150000_xp_functions.sql` | `compute_level_from_xp(xp_total)`, `award_xp(...)` (SECURITY DEFINER) |
| `supabase/migrations/20260221100000_profiles_shopify_customer_id.sql` | Adds `profiles.shopify_customer_id` for order→profile resolution |
| `supabase/migrations/20260222100001_seed_config_xp_rules.sql` | Seeds default `config_xp_rules` (mag_read, mag_quiz, mag_download, purchase, ugc_approved) |
| `supabase/migrations/20260224100000_seed_sample_manga_quests.sql` | Sample quests (optional seed) |
| `supabase/migrations/20260225000000_reward_claims_external_ref.sql` | Adds `reward_claims.external_ref` for discount code storage |
| `supabase/migrations/20260226000000_referral_tables.sql` | `referral_codes` (profile_id, code), `referral_events` (referrer_id, referee_id, code_used, event_type, source_ref); RLS |
| `supabase/migrations/20260226000001_vip_tiers_and_discord_user_id.sql` | Seeds config_xp_rules.vip_tiers; adds profiles.discord_user_id |

### 1.2 Tables

| Table | Role |
|-------|------|
| `xp_ledger` | Append-only; every XP award is one row (profile_id, source, source_ref, xp_delta, reason, created_at) |
| `xp_state` | Materialized total and level per profile (profile_id PK, xp_total, level, updated_at) |
| `discord_event_ledger` | Discord events from bot (profile_id, discord_user_id, guild_id, event_type, etc.) for quest evaluation |
| `mnky_seasons` | Optional seasons for XP/quest windows |
| `rewards` | Reward definitions (type: discount_code, product_access, discord_role, digital_badge, early_access; payload, min_level, rule, active) |
| `reward_claims` | Issued rewards per profile (profile_id, reward_id, status: issued/redeemed/revoked, issued_at) |
| `quests` | Quest definitions (title, description, rule jsonb, xp_reward, season_id, active, cooldown_days, requires_purchase, requires_discord_link) |
| `quest_progress` | Per-profile, per-quest progress (profile_id, quest_id, progress jsonb, completed_at); unique (profile_id, quest_id) |
| `ugc_submissions` | UGC with status pending/approved/rejected; approval can trigger XP |
| `config_xp_rules` | Key-value config (key, value jsonb) for mag_read, mag_quiz, mag_download, purchase, ugc_approved, vip_tiers |
| `referral_codes` | Per-profile referral code (profile_id, code unique); RLS select/insert own | 
| `referral_events` | Referral events (referrer_id, referee_id, code_used, event_type, source_ref); idempotent by source_ref |

### 1.3 Functions

| Function | Purpose |
|----------|---------|
| `compute_level_from_xp(xp_total bigint)` | Level 1–5 at 0, 100, 250, 500, 900 XP; then +500 per level |
| `award_xp(p_profile_id, p_source, p_source_ref, p_xp_delta, p_reason)` | SECURITY DEFINER; inserts into xp_ledger, recomputes sum, updates xp_state |

### 1.4 Profile linkage

- `profiles.shopify_customer_id`: set on Customer Account API link or when orders/paid webhook resolves profile by email; used to attribute order XP to the correct profile.

---

## 2. API routes

### 2.1 XP and gamification

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `apps/web/app/api/xp/award/route.ts` | POST | `MOODMNKY_API_KEY` | Award XP; validates body (profileId, source, sourceRef, xpDelta, reason); checks `isProfileEligibleForXp`; calls `award_xp` RPC |
| `apps/web/app/api/xp/state/route.ts` | GET | Supabase session | Returns current user's xp_total, level, updated_at from xp_state |

### 2.2 Discord

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `apps/web/app/api/discord/events` | POST | `MOODMNKY_API_KEY` | Ingest Discord events; body: profileId, discordUserId, guildId, channelId?, eventType, eventRef?, value?; writes discord_event_ledger, sends Inngest `discord/event.received` |

### 2.3 Shopify

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `apps/web/app/api/shopify/webhooks/route.ts` | POST | HMAC (x-shopify-hmac-sha256) | Verifies signature; on orders/paid: resolves profile by customer id or email, sends Inngest `shopify/order.paid` (orderId, profileId, subtotal, shop); on orders/cancelled or refunds/create sends `shopify/order.cancelled_or_refunded` |

### 2.4 App proxy (Shopify theme)

All under `apps/web/app/apps/mnky/`; prefix `apps`, subpath `mnky` in Partner Dashboard.

| Route | Method | Purpose |
|-------|--------|---------|
| `apps/web/app/apps/mnky/session/route.ts` | GET | Returns short-lived JWT for theme to call other APIs (APP_PROXY_JWT_SECRET or MOODMNKY_API_KEY) |
| `apps/web/app/apps/mnky/api/issues/route.ts` | GET | List published manga issues (mnky_issues + mnky_collections) |
| `apps/web/app/apps/mnky/api/quests/route.ts` | GET | List active quests |
| `apps/web/app/apps/mnky/api/balance/route.ts` | GET | App proxy: verify signature, return xp_state for logged_in_customer_id (Shopify proxy params) |
| `apps/web/app/apps/mnky/api/points-preview/route.ts` | GET | Query `subtotal`; return potential XP from config_xp_rules.purchase tiers; rate-limited |

### 2.5 Rewards

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `apps/web/app/api/rewards/route.ts` | GET | Supabase session | List active rewards catalog (id, type, payload, min_level) |
| `apps/web/app/api/rewards/my-claims/route.ts` | GET | Supabase session | List current user's reward claims |
| `apps/web/app/api/rewards/redeem/route.ts` | POST | Supabase session | Body: rewardId; validate balance/min_level; create claim; for discount_code create Shopify discount; deduct XP |

### 2.6 Referral

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `apps/web/app/api/referral/my-code/route.ts` | GET | Supabase session | Returns current user's referral code (creates one if none) |
| `apps/web/app/api/referral/apply/route.ts` | POST | `MOODMNKY_API_KEY` | Body: code, refereeId, eventType (signed_up \| first_order); idempotent by source_ref; records referral_events |

### 2.7 Leaderboard

| Route / helper | Purpose |
|----------------|---------|
| `GET /api/gamification/leaderboard?limit=N` | Returns leaderboard (rank, profileId, displayName, xpTotal, level) using admin client; for theme/API consumers |
| `apps/web/lib/gamification/leaderboard.ts` | Server-only `getLeaderboard(limit)` for use in server components (e.g. /verse/leaderboard page) |

### 2.8 Other related routes

| Route | Purpose |
|-------|---------|
| `apps/web/app/api/flowise/tools/xp/propose-award/route.ts` | Flowise tool; proposes XP award (actual award via POST /api/xp/award) |
| `apps/web/app/api/ugc/[id]/route.ts` | PATCH: approve/reject UGC; approve can trigger Inngest ugc/on.approved → award_xp |
| `apps/web/app/api/mag/read-event/route.ts` | Inserts mnky_read_events; completion can trigger Inngest mag/read.completed |
| `apps/web/app/api/mag/quiz/submit/route.ts` | Inserts mnky_quiz_attempts; pass can trigger Inngest mag/quiz.passed |
| `apps/web/app/api/mag/download/route.ts` | Records download; triggers Inngest mag/download.recorded |

---

## 3. Inngest functions

All in `apps/web/lib/inngest/functions.ts`.

| Event | Function ID | Purpose |
|-------|-------------|---------|
| `shopify/order.paid` | shopify-order-paid | Reads config_xp_rules.purchase tiers (or default 50 @ $25, 150 @ $75); checks isProfileEligibleForXp; calls award_xp |
| `discord/event.received` | discord-event-received | Inserts discord_event_ledger row; sends quest/evaluate |
| `quest/evaluate` | quest-evaluate | For active quests, checks requirements (read_issue, discord_message, purchase, mag_quiz, ugc_approved, xp_source); on full completion upserts quest_progress, awards quest xp_reward |
| `mag/read.completed` | mag-read-completed | Idempotent XP from config mag_read; sends quest/evaluate |
| `mag/quiz.passed` | mag-quiz-passed | Idempotent XP from config mag_quiz; sends quest/evaluate |
| `mag/download.recorded` | mag-download-recorded | Idempotent XP from config mag_download; sends quest/evaluate |
| `ugc/on.approved` | ugc-on-approved | Awards ugc_approved XP from config; sends quest/evaluate |
| `shopify/order.cancelled_or_refunded` | (if implemented) | Optional: reverse or adjust XP |

Client: `apps/web/app/api/inngest/route.ts`.

---

## 4. UI touch points

### 4.1 Verse Backoffice (LABZ dashboard)

| File | Purpose |
|------|---------|
| `apps/web/app/(dashboard)/verse-backoffice/xp/page.tsx` | XP & Quests page: lists quests (title, xp_reward, cooldown_days, active), displays config_xp_rules (mag_read, mag_quiz, mag_download, purchase) as read-only JSON |
| `apps/web/lib/sidebar-config.tsx` | `verseBackofficeItems` includes { title: "XP & Quests", href: "/verse-backoffice/xp", icon: Trophy } |

### 4.2 Verse storefront

| File | Purpose |
|------|---------|
| `apps/web/app/(storefront)/verse/quests/page.tsx` | Quests page: active quests grid, per-quest "Done" badge and "N of M completed" when authenticated; link to Connect Discord |
| `apps/web/app/(storefront)/verse/rewards/page.tsx` | Rewards hub: balance (XP/level), rewards catalog, redeem (discount codes), referral code card; requires auth for redeem |
| `apps/web/app/(storefront)/verse/leaderboard/page.tsx` | Leaderboard: top N by XP, rank, display name, tier name (from vip_tiers); uses getLeaderboard() server-side |
| `apps/web/components/verse/verse-rewards-catalog.tsx` | Client: redeem button, dialog with claimed code (copy) |
| `apps/web/components/verse/verse-referral-code.tsx` | Client: fetches /api/referral/my-code, shows code and copy button |
| `apps/web/components/verse/verse-header-xp.tsx` | Client: fetches /api/xp/state, shows "N XP · Tier" link to /verse/rewards in header |
| `apps/web/components/verse/verse-header.tsx` | Includes Rewards nav link and VerseHeaderXp when user present |
| `apps/web/components/verse/verse-free-tier-banner.tsx` | Banner for free-tier / subscription context on quests and XP |

### 4.3 Dojo

| File | Purpose |
|------|---------|
| `apps/web/components/dojo/dojo-quests-card.tsx` | Quests card: fetches quests + completed count, link to /verse/quests |
| `apps/web/app/dojo/community/page.tsx` | Community page: link to /verse/quests (target="_blank") |
| `apps/web/lib/dojo-sidebar-config.tsx` | "Quests & XP" nav item → /verse/quests (external) |

### 4.4 Leaderboard and referral

- **Leaderboard:** `/verse/leaderboard` shows top users by XP with rank, display name, tier (from config vip_tiers).
- **Referral:** Rewards page shows "Your referral code" card (VerseReferralCode) when logged in; apply referral server-side via POST /api/referral/apply (e.g. from sign-up or first-order flow).

---

## 5. Shopify

### 5.1 Webhook

- **URL:** `POST /api/shopify/webhooks` (must be registered in Partner Dashboard for topic `orders/paid`, optionally `orders/cancelled`, `refunds/create`)
- **Env:** `SHOPIFY_WEBHOOK_SECRET` or `SHOPIFY_API_SECRET` for HMAC verification (see `.env.example`)

### 5.2 Theme extension

- **Extension:** `extensions/mood-mnky-theme` (type: theme)
- **Blocks:** mnky-verse-issue-teaser, mnky-assistant-embed, blending-cta, fragrance-finder-cta, subscription-cta, verse-blog, **mnky-rewards-launcher** (app embed), **mnky-potential-points** (section block)

### 5.3 App proxy

- **Config:** See `docs/MNKY-VERSE-APP-PROXY-SETUP.md` — prefix `apps`, subpath `mnky`; proxy URL points to app base (e.g. https://mnky-command.moodmnky.com/apps/mnky)
- **Routes:** session, api/issues, api/quests, api/balance, api/points-preview (see §2.4)

---

## 6. Configuration and env

| Env / config | Purpose |
|--------------|---------|
| `MOODMNKY_API_KEY` | Protects POST /api/xp/award, POST /api/discord/events, internal APIs |
| `SHOPIFY_WEBHOOK_SECRET` or `SHOPIFY_API_SECRET` | Shopify webhook HMAC |
| `APP_PROXY_JWT_SECRET` or `MOODMNKY_API_KEY` | App proxy session JWT (apps/mnky/session) |
| `config_xp_rules` (Supabase) | Keys: mag_read, mag_quiz, mag_download, purchase, ugc_approved, vip_tiers (see docs/MAG-XP-RULES.md) |
| `DISCORD_LEVEL_ROLES` | Optional; comma-separated level:roleId (e.g. 1:roleId1,2:roleId2) for discord-role-sync-by-level |
| `DISCORD_GUILD_ID_MNKY_VERSE` | Guild ID for Discord role sync and default guild operations |

---

## 7. Flows (summary)

1. **Earn XP (order):** Shopify sends orders/paid → webhook verifies HMAC → resolve profile by shopify_customer_id/email → Inngest shopify/order.paid → award_xp with purchase tiers.
2. **Earn XP (quest):** User completes actions (read, quiz, Discord, UGC approval) → Inngest mag/* or ugc/on.approved or discord/event.received → award_xp + quest/evaluate → quest_progress updated, quest XP awarded if requirements met.
3. **View XP/quests:** User opens /verse/quests (storefront) or Dojo Quests card; backoffice /verse-backoffice/xp shows quest list and XP rules.
4. **Redemption:** POST /api/rewards/redeem creates claim, deducts XP, creates Shopify discount for discount_code type; Rewards hub shows catalog and redeem dialog.
5. **Leaderboard:** /verse/leaderboard uses getLeaderboard() (admin client); optional GET /api/gamification/leaderboard for external consumers.
6. **Referral:** GET /api/referral/my-code returns or creates code; POST /api/referral/apply records events (signed_up, first_order); Rewards page shows referral code card.
7. **Discord roles by level:** Hourly Inngest job syncs guild member roles from DISCORD_LEVEL_ROLES by XP level; profiles.discord_user_id set in Verse auth callback after Discord link/sign-in.

---

## 8. References

- [PRD-Gamification-MNKY-VERSE.md](PRD-Gamification-MNKY-VERSE.md)
- [MAG-XP-RULES.md](MAG-XP-RULES.md)
- [FREE-TIER-SUBSCRIPTION.md](FREE-TIER-SUBSCRIPTION.md)
- [MNKY-VERSE-APP-PROXY-SETUP.md](MNKY-VERSE-APP-PROXY-SETUP.md)
- [DISCORD-INTEGRATION-PLAN.md](DISCORD-INTEGRATION-PLAN.md)
