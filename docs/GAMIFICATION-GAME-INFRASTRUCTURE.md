# Gamification Game Infrastructure (MNKY Rewards)

This document describes the current MNKY gamification model, maps Gameball concepts to it, defines target flows, and outlines gaps and future schema options. The goal is a **custom “MNKY Rewards”** system that replicates Gameball’s **concepts** (not their API), MOOD MNKY–branded and fully owned.

---

## 1. Current MNKY model

### 1.1 Ledger and state

- **xp_ledger:** Append-only. Every XP award is one row: `profile_id`, `source`, `source_ref`, `xp_delta`, `reason`, `created_at`. Never overwrite; source_ref supports idempotency (e.g. one XP per order, per issue read).
- **xp_state:** Materialized view per profile: `xp_total`, `level`, `updated_at`. Updated atomically when awarding XP via the `award_xp` RPC.
- **Level curve:** `compute_level_from_xp(xp_total)` — levels 1–5 at 0, 100, 250, 500, 900 XP; then +500 per level. Tune later via config or new function.

### 1.2 Quests and rules

- **quests:** Definitions with `rule` (jsonb) describing requirements (read_issue, discord_message, purchase, mag_quiz, ugc_approved, xp_source) and optional `xp_reward`. Progress in `quest_progress`; completion awards XP and sets `completed_at`.
- **config_xp_rules:** Key-value config for mag_read, mag_quiz, mag_download, purchase, ugc_approved. Drives XP amounts and purchase tiers (e.g. 50 XP @ $25, 150 @ $75).

### 1.3 Rewards and claims

- **rewards:** Catalog of reward types (discount_code, product_access, discord_role, digital_badge, early_access) with `payload`, `min_level`, `rule`, `active`.
- **reward_claims:** Per-profile issued rewards with status (issued, redeemed, revoked). No redemption API or Shopify discount creation wired yet.

### 1.4 Event sources

Earn flows today: Shopify order.paid (webhook → Inngest → award_xp); Discord events (POST /api/discord/events → ledger → quest/evaluate); manga read/quiz/download (Inngest); UGC approval (Inngest); quest completion (quest/evaluate). All go through `award_xp` and optional `quest/evaluate`.

### 1.5 Source of truth and async

- **Supabase** is the single source of truth (Postgres, RLS, functions).
- **Inngest** handles async: order.paid, discord/event.received, quest/evaluate, mag/*, ugc/on.approved.
- **Shopify Admin API** will be used for creating discount codes when redemption is implemented.

---

## 2. Gameball → MNKY conceptual mapping

| Gameball concept | MNKY equivalent (current or planned) |
|------------------|--------------------------------------|
| **Player / customerId** | `profiles.id`; `profiles.shopify_customer_id` for order attribution |
| **Points balance** | `xp_state.xp_total` (today XP = points; optional separate points currency later) |
| **Events** | `xp_ledger` sources (purchase, quest, mag_*, ugc_approved, etc.); optional future generic `events` table for campaign-style rules |
| **Orders API** | Shopify webhook `orders/paid` → Inngest → `award_xp` (implemented) |
| **Reward campaigns** | `quests` + `config_xp_rules`; optional future campaign table with event-based rules |
| **VIP tiers** | `xp_state.level` + `compute_level_from_xp`; optional named tiers (Bronze/Silver/Gold) in config |
| **Get Customer Balance** | `GET /api/xp/state` (xp_total, level); optional dedicated balance endpoint with pending/expiring if we add those |
| **Redemption (pay with points / coupons)** | `rewards` + `reward_claims`; **to build:** redemption API + Shopify discount code creation |
| **Referral** | Not implemented; **to design:** referral codes, referee/referrer tracking, rewards |
| **Leaderboard** | Not implemented; **to design:** read-only API from `xp_state` (and optional season window) |
| **Widget / launcher** | **To build:** theme app embed (see docs/SHOPIFY-LOYALTY-EXTENSION.md) |

---

## 3. Target flows

### 3.1 Earn

- **Orders:** orders/paid → resolve profile → Inngest → award_xp (purchase tiers from config). Done.
- **Quests:** User completes requirements (read issue, pass quiz, Discord message, UGC approved, etc.) → quest/evaluate → quest_progress updated, quest XP awarded. Done.
- **Manga / UGC / Discord:** Events trigger Inngest → award_xp + quest/evaluate. Done.
- **Future:** Referral (referrer + referee rewards); one-time or recurring “actions” from a generic events table.

### 3.2 Redeem

- **Target:** User sees rewards catalog (from `rewards`), chooses “Redeem X points → $5 off” (or similar); backend checks balance and min_level, creates reward_claim, and for discount_code type creates a Shopify discount code (Admin API), returns code to user.
- **Not yet:** Redemption API; Shopify Price Rule + Discount Code creation; optional “pay with points” at checkout (would require Storefront API or checkout extension).

### 3.3 Display

- **Target:** Balance and level visible in Verse header/nav; dedicated Rewards hub (balance, “Earn more,” catalog, redeem); quest list with optional progress (N of M completed); on Shopify theme: launcher and “potential points” block via App Proxy.
- **Current:** Quest list at /verse/quests; backoffice XP & Quests; no balance in header, no rewards catalog UI.

---

## 4. Gaps

- **Redemption UI and API:** rewards/reward_claims exist; no list-rewards or create-claim endpoint; no Shopify discount creation.
- **Balance in header:** No XP/level in Verse or Dojo nav.
- **Rewards hub:** No /verse/rewards page (catalog + redeem).
- **Quest progress on /verse/quests:** Could show “3 of 5 completed” via quest_progress.
- **VIP tier names:** Level is numeric; optional display names (Bronze/Silver/Gold) in config.
- **Referral:** No referral codes, no referee/referrer tracking or rewards.
- **Leaderboard:** No read-only ranking API (e.g. top by xp_total, optional season filter).
- **Notifications:** No “you earned X” or “reward available” API or UI.
- **Shopify storefront:** No loyalty launcher embed, no “potential points” block, no balance from App Proxy.

---

## 5. References to temp and internal docs

- **temp/gameball-docs:** Order handling (submit-order, preview-points), points redemption (index, pay-with-points, convert-points-to-coupons), build-your-own-ui (customer-balance, vip-tiers, leaderboard, reward-campaigns, coupons, notifications, widget-configurations). Use for UX and API shape ideas, not for calling Gameball APIs.
- **temp/gameball-react-native:** SDK patterns if we add a small client helper; we use our own backend and Supabase.
- **CHATGPT-GAMIFICATION-UPDATE.md:** Blueprint for custom loyalty (ledger, rules, rewards, redemption, idempotency, Shopify discount codes). Aligns with this doc.

---

## 6. Future schema (optional)

### 6.1 Points vs XP

Today XP is the single currency. If we later split “points” (redeemable) from “XP” (level/display):

- **loyalty_wallets:** profile_id, points_balance, lifetime_points, tier_id?, updated_at.
- **loyalty_ledger:** profile_id, source, source_ref, delta_points, reason, created_at (append-only).
- Conversion or dual-award: e.g. order awards both XP and points, or points = XP for simplicity.

Not required for MVP; current design uses XP as the single balance.

### 6.2 Referral

- **referral_codes:** profile_id (referrer), code (unique), created_at.
- **referral_events:** referrer_id, referee_id (or referee profile when linked), code_used, event_type (signed_up, first_order), reward_issued_at, created_at.
- **Rewards:** Referrer and referee rewards configured in `rewards` or a dedicated referral_rewards config; idempotency via source_ref (e.g. referee_id + event_type).

### 6.3 Leaderboard

- Read-only: query `xp_state` joined with `profiles` (display name, avatar if desired), ordered by xp_total desc, with optional filter by `mnky_seasons` (e.g. season_id and created_at in range). No new tables; optional cache or materialized view for performance.

### 6.4 Expiring points / pending points

If we add “points expire” or “pending until order ships”:

- **xp_ledger** (or loyalty_ledger) could carry `expires_at` or `available_after`; balance endpoint would return available vs pending vs expiring. Gameball’s Get Customer Balance includes pendingPoints, nextExpiringPointsAmount, nextExpiringPointsDate — we can mirror that in a future balance API and optional columns.

---

## 7. Summary

The current MNKY system already implements a ledger-based XP and quest system with Shopify, Discord, manga, and UGC as earn sources. The **game infrastructure** is in place; the main gaps are **redemption** (API + Shopify discount codes), **display** (balance in header, rewards hub), **referral** and **leaderboard** (design + implementation), and **Shopify theme** (launcher + blocks + App Proxy balance/points-preview). This document and GAMIFICATION-TOUCHPOINTS.md, SHOPIFY-LOYALTY-EXTENSION.md, and the deep research report together define the path to a full Gameball-style, MOOD MNKY–custom loyalty experience.
