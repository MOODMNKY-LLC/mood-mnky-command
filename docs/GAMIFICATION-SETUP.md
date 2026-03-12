# Gamification setup (MNKY Rewards)

Checklist to get the gamification system fully functional. See [GAMIFICATION-TOUCHPOINTS.md](GAMIFICATION-TOUCHPOINTS.md) and [GAMIFICATION-GAME-INFRASTRUCTURE.md](GAMIFICATION-GAME-INFRASTRUCTURE.md) for architecture.

## 1. Environment

- **Shopify redeem:** `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_ADMIN_API_TOKEN` must be set where `POST /api/rewards/redeem` runs. The token needs discount write scope so `createDiscountCode` (Shopify Admin GraphQL) succeeds.
- **App Proxy:** Configure in Shopify Partner (App → App setup → App proxy): prefix `apps`, subpath `mnky`, proxy URL to your app (e.g. `https://your-app.vercel.app/apps/mnky`). Env `APP_PROXY_JWT_SECRET` or `MOODMNKY_API_KEY` used for session; theme blocks call `/apps/mnky/api/balance` and `/apps/mnky/api/points-preview`.
- **Internal API key:** `MOODMNKY_API_KEY` for `/api/xp/award`, `/api/discord/events`, `/api/referral/apply`. Inngest first-order referral step calls `/api/referral/apply` using this key; ensure `NEXT_PUBLIC_APP_URL` (or `VERCEL_URL`) is set so the request reaches your app.

## 2. UGC approval → Inngest

When UGC is approved in Verse Backoffice (PATCH `/api/ugc/[id]` with `status: "approved"`), the route sends `ugc/on.approved` to Inngest. The Inngest function `ugcOnApproved` awards XP from `config_xp_rules.ugc_approved` and triggers `quest/evaluate`. No extra wiring required.

## 3. Referral

- **Sign-up:** After a user signs up with a referral code, call `POST /api/referral/record-signup` (session auth) with body `{ code: "MNKY-XXXXXX" }`. Wire this from your sign-up success flow (e.g. redirect or client after Supabase auth signUp) when the user entered a code.
- **First order:** Handled in Inngest `shopifyOrderPaid`: when the order is the profile’s first purchase, we look up `referral_events` for `referee_id = profileId` and `event_type = signed_up`, then call `POST /api/referral/apply` with that code and `eventType: "first_order"`. No extra wiring if `MOODMNKY_API_KEY` and app URL are set.

## 4. Order cancelled / refunded

The webhook sends `shopify/order.cancelled_or_refunded`; the Inngest function `shopifyOrderCancelledOrRefunded` reverses the purchase XP for that order (one clawback per order, idempotent). Register the webhook for `orders/cancelled` and `refunds/create` in Partner Dashboard if you want clawback.

## 5. Theme blocks

Enable `mnky-rewards-launcher` and `mnky-potential-points` on the desired templates. Set the launcher block’s `app_base_url` (and any other settings) so balance and points-preview requests go through the App Proxy to your app.

## 6. Seed data

Ensure at least one active reward exists (e.g. `discount_code` with `payload.cost_xp`, `discount_value`, etc.) and `config_xp_rules` has keys: `purchase`, `vip_tiers`, `mag_read`, `mag_quiz`, `mag_download`, `ugc_approved`. Use migrations (e.g. `20260222100001_seed_config_xp_rules.sql`, `20260226000001_vip_tiers_and_discord_user_id.sql`) or Verse Backoffice / SQL.
