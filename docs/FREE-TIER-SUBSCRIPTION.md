# Free-Tier Subscription (MNKY VERSE)

This document describes the official free-tier subscription to the MOOD MNKY brand: data model (Supabase), API, connection to MNKY BOX and Verse, and future Stripe/Shopify integration for a paid "member" tier.

## 1. Data model (Supabase)

- **profiles.subscription_tier** — `'free'` | `'member'` | null.  
  - **free:** Free tier: access to drops, manga, community, quests, Discord link.  
  - **member:** Paid/full member (future): same as free plus member-only perks (e.g. discount, early access, Shopify customer tag).  
  - **null:** Legacy or not yet claimed; user can claim free via `/verse/join` or `POST /api/verse/subscription/join-free`.

- **profiles.stripe_customer_id** — Optional. Set when Stripe is configured and user joins free tier (or upgrades later), for future paid checkout.

Migration: `supabase/migrations/20260324000000_profiles_subscription_tier.sql`. New signups get `subscription_tier = 'free'` via `handle_new_user` trigger.

## 2. API

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|--------|
| POST | `/api/verse/subscription/join-free` | Session | Claim free tier (idempotent). |
| GET | `/api/me/subscription` | Session | Return `{ subscription_tier: 'free' \| 'member' \| null }`. |

## 3. Verse and MNKY BOX connection

- **Box CTA:** "Unlock Members Access" links to **/verse/join** (not /verse).  
- **/verse/join:** If not authenticated, redirects to sign-in with `next=/verse/join`. If authenticated, client calls `POST /api/verse/subscription/join-free` then redirects to `/verse`. So one click from the box: sign-in/sign-up → claim free tier → Verse home.
- **New users:** On first sign-up, `handle_new_user` sets `subscription_tier = 'free'`; no need to visit /verse/join unless we want to ensure they hit the join endpoint (e.g. for analytics).

## 4. Stripe (future paid tier)

- **Current:** No Stripe SDK in the app; no `STRIPE_SECRET_KEY` in env. The **Stripe MCP** (plugin-stripe-stripe) can be used to create products/prices and customers when adding a paid "member" tier.
- **Recommended (Stripe integration recommender):** Use Stripe Billing for subscriptions: create a Product "MNKY VERSE Member" and a recurring Price; when user upgrades, create or retrieve Stripe Customer, create Subscription, and set `profiles.subscription_tier = 'member'` (and optionally store `stripe_subscription_id` in a new column or table). Webhook `customer.subscription.updated` / `deleted` can sync status back to Supabase.
- **Free tier today:** No Stripe call required. Optionally, when `STRIPE_SECRET_KEY` is set, `POST /api/verse/subscription/join-free` can create a Stripe Customer and set `profiles.stripe_customer_id` so the same customer is used for future upgrade.

## 5. Shopify connection

- **Current:** `profiles.shopify_customer_id` links Verse profile to Shopify customer (Customer Account API / OAuth). No customer tag or metafield is set for free vs member today.
- **Future:** When `subscription_tier = 'member'`, sync a Shopify customer tag (e.g. `mnky-verse-member`) or metafield via Admin API so the theme or checkout can show member pricing or perks. Use **Shopify MCP** or existing Shopify client in the app for tag/metafield updates.

## 6. Gamification and free tier

XP and quests are gated on subscription so only users who have claimed free tier (or are members) earn XP.

- **Eligibility:** `subscription_tier` in `('free', 'member')` is required to receive XP. Implemented via `isProfileEligibleForXp(profileId)` in `apps/web/lib/xp-eligibility.ts` (uses admin client to read `profiles.subscription_tier`).
- **XP award gating:** Before any XP award we check eligibility. If the profile has not claimed free tier (`subscription_tier` is null), the award is skipped (no ledger write). Applied in:
  - `POST /api/xp/award` — returns `{ ok: true, awarded: 0, reason: "subscription_required" }` when not eligible.
  - Inngest: `shopify/order.paid`, `quest/evaluate` (quest completion still recorded; XP only when eligible), `mag/download.recorded`, `mag/quiz.passed`, `mag/read.completed`, `ugc/on.approved`.
  - UGC moderation: `PATCH /api/ugc/[id]` (approve) awards XP only when the submitter’s profile is eligible.
- **Quest completion:** Quest progress is still marked complete for ineligible users (so they see completion state); only the XP reward is withheld until they join free tier.
- **Verse UI:** Manga, drops, chapter reader, and quests pages show `VerseFreeTierBanner` when the user is unauthenticated or `subscription_tier` is null, with CTA to `/verse/join` (“Join free to earn XP and unlock quests”).

## 7. References

- [MNKY-BOX-EDITORIAL-REFINED.md](MNKY-BOX-EDITORIAL-REFINED.md) — §6 Free-tier, §7 Discord
- [DISCORD-INTEGRATION-PLAN.md](DISCORD-INTEGRATION-PLAN.md) — Community and drop quests
- Migration: `supabase/migrations/20260324000000_profiles_subscription_tier.sql`
- API: `apps/web/app/api/verse/subscription/join-free/route.ts`, `apps/web/app/api/me/subscription/route.ts`
- Verse join page: `apps/web/app/(storefront)/verse/join/page.tsx`
- XP eligibility: `apps/web/lib/xp-eligibility.ts`; manga/quests banners: `apps/web/components/verse/verse-free-tier-banner.tsx`

## 8. Dojo onboarding

- **Dojo dashboard:** First-time (or unsubscribed) users see a free-tier onboarding card and a perpetual notice until they join. Once subscribed, a “Free tier active” (or “Member”) verification is shown. See [FREE-TIER-ONBOARDING-DOJO.md](FREE-TIER-ONBOARDING-DOJO.md).
- API: `POST /api/me/free-tier-prompt-dismiss` to dismiss the card (remind-me-later); card can reappear after 7 days.
