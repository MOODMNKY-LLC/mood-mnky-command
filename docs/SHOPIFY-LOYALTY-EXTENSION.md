# Shopify Loyalty Extension (MNKY Rewards)

Design for exposing MNKY Rewards (points/XP, level, potential points, redemption) on the Shopify storefront via theme app extension and App Proxy. This replicates, within our ecosystem, the kind of experience Gameball provides with its loyalty launcher and blocks (potential points on product page, balance in widget).

---

## 1. Overview

- **Extension:** Reuse `extensions/mood-mnky-theme` (type: theme). Add new **app embed** and **blocks** for loyalty.
- **Backend:** Extend App Proxy under `apps/web/app/apps/mnky/` with balance and points-preview endpoints. Customer identity on the storefront is required for balance; points-preview can be anonymous (rules-based).
- **Auth on storefront:** Storefront is often unauthenticated. Options: (1) App Proxy receives Shopify-signed params and optional customer id (when logged in) and returns customer-scoped data; (2) Launcher offers a “View rewards” CTA that deep-links to Verse (`/verse/rewards`) where the user is authenticated. Recommended: support both — show balance when customer is known (e.g. via Liquid `customer.id` passed securely), otherwise show CTA to log in or go to Verse.

---

## 2. Theme app extension components

### 2.1 MNKY Rewards Launcher (app embed)

**Purpose:** A floating launcher button (similar to MNKY Assistant) that opens a drawer or modal with balance and rewards.

**Behavior:**

- **Button:** Configurable position (left/right), optional icon and label (e.g. “Rewards” or “Points”). Use existing pattern from `mnky-assistant-embed.liquid` (fixed position, z-index, aria attributes).
- **On click:** Open a drawer or modal. Content:
  - **If customer known:** Fetch balance (and optionally rewards) from App Proxy `GET /apps/mnky/api/balance` (see §3). Display points/XP, level, and “Earn more” / “Redeem” CTA linking to Verse.
  - **If customer unknown:** Show “View your rewards” CTA that links to `{app_base_url}/verse/rewards` (or login). Optional: show points-preview for current cart if cart total is available in Liquid.
- **Security:** Do not pass customer id in clear query params from the theme. Prefer: theme calls App Proxy with Shopify’s signed query params; backend resolves customer from Shopify session or from a signed token that the app issues when customer is identified (e.g. after Customer Account API login on Verse, we could set a cookie or token that the proxy validates). For MVP, option (2) — “View rewards” link to Verse — avoids storefront customer resolution; Phase 2 can add proxy balance when customer id is available via Liquid and verified server-side.

**Settings (block or embed schema):**

- `app_base_url` (text): e.g. https://mnky-command.moodmnky.com
- `position` (select): bottom-left, bottom-right
- `button_label` (text): e.g. “Rewards”
- `button_icon` (optional): URL or preset (e.g. trophy/star)

**Implementation note:** In Shopify theme extensions, “app embed” is an extension type that can be enabled globally in Theme settings → App embeds. The launcher is a good candidate for an app embed so it appears on every page without the merchant adding a block. Alternatively, a **block** with `target: "section"` or a dedicated **app embed block** (if the extension supports it) can be used. Use the same pattern as `mnky-assistant-embed.liquid` and the existing `app-blocks.css` for consistency.

### 2.2 Potential points block

**Purpose:** Show “Earn X points with this purchase” on product page or cart.

**Behavior:**

- **Product page:** Optional: “Earn up to X points” based on product price (points rule from config). Requires backend to return points per dollar or tier; product price is available in Liquid, so theme can call `GET /apps/mnky/api/points-preview?subtotal={product.price}` and display the result.
- **Cart / cart drawer:** “Earn X points with this order” using cart total. Theme passes `subtotal` to same `points-preview` endpoint.
- **Anonymous:** No customer required; endpoint returns points for a given subtotal from `config_xp_rules.purchase` tiers.

**Settings:**

- `app_base_url`, `heading` (e.g. “Earn points”), `fallback_text` when API unavailable

**Backend:** `GET /apps/mnky/api/points-preview?subtotal=123.45` (see §3.2).

### 2.3 Rewards / balance block (section block)

**Purpose:** A block that can be added to a section (e.g. footer, account area) to show current balance when customer is logged in.

**Behavior:**

- When customer is logged in (Liquid `customer` exists), theme can call App Proxy balance endpoint with secure customer context (see §3.1). Display: points/XP, level, link to full rewards hub at Verse.
- When not logged in: show “Log in to see your rewards” or link to Verse login/rewards.

**Settings:** Same as others: `app_base_url`, optional heading.

---

## 3. Backend (App Proxy) endpoints

Base path: same as existing proxy, e.g. `https://{shop}.myshopify.com/apps/mnky` → app URL `/apps/mnky`. All below are under `apps/web/app/apps/mnky/`.

### 3.1 GET /apps/mnky/api/balance

**Purpose:** Return points/XP and level for the **current Shopify customer**.

**Request:** GET. Query params include Shopify’s standard proxy params (`shop`, `path_prefix`, `signature`, `timestamp`, etc.). Customer identification: (1) If theme can pass customer id (e.g. in a signed or HMAC’d param that only our backend can verify), backend resolves `profiles.shopify_customer_id = customer_id` and returns that profile’s `xp_state` (xp_total, level). (2) Alternatively, use a short-lived token issued by our app when the customer logs in via Customer Account API (e.g. stored in cookie or passed from Verse); proxy validates token and returns balance. Do not accept raw customer id in query without verification (to prevent enumeration).

**Response (JSON):** e.g. `{ "xpTotal": 350, "level": 2, "updatedAt": "..." }`. If customer unknown or unauthenticated: `401` or `{ "authenticated": false, "message": "View rewards at ..." }` with link to Verse.

**Security:** Verify Shopify proxy signature; verify customer context (signed param or app-issued token). Return only that customer’s data.

### 3.2 GET /apps/mnky/api/points-preview

**Purpose:** Return “potential points” for a given subtotal (no customer required).

**Request:** GET. Query: `subtotal` (number, required). Optional: `shop` or other proxy params for logging.

**Response (JSON):** e.g. `{ "points": 150, "subtotal": 99.99 }`. Backend reads `config_xp_rules.purchase` (tiers: subtotal_min → xp), computes points for the given subtotal (same logic as Inngest shopify/order.paid), returns points. If no config, use same default as order.paid (e.g. 50 @ $25, 150 @ $75).

**Security:** No PII; rate-limit per IP or per shop to avoid abuse.

---

## 4. Customer identity on storefront

Shopify’s app proxy **automatically adds** `logged_in_customer_id` to forwarded requests when a customer is logged in on the storefront (and leaves it empty otherwise). The request also includes `shop`, `path_prefix`, `timestamp`, and `signature`. After **verifying the signature** (HMAC-SHA256 of sorted query params with the app’s shared secret), the backend can trust `logged_in_customer_id` and return balance only for that customer. No custom signed params or cookies are required for the proxy path—cookies are stripped by Shopify. See [DEEP-RESEARCH-LOYALTY-SHOPIFY.md](DEEP-RESEARCH-LOYALTY-SHOPIFY.md) and [Shopify: Authenticate app proxies](https://shopify.dev/docs/apps/build/online-store/app-proxies/authenticate-app-proxies).

- **Backend:** Verify proxy signature; read `logged_in_customer_id`; resolve profile by `profiles.shopify_customer_id` (normalize ID format if needed); return that profile’s xp_state only.
- **Theme:** Request the balance URL through the proxy (same path the storefront uses, so Shopify forwards the request with the above params). No need to pass customer id explicitly from Liquid.

---

## 5. Implementation phases

**Phase 1 (this doc):** Design only — launcher embed, potential points block, balance block, proxy endpoints and security approach. No code changes.

**Phase 2:**  
- Add App Proxy routes: `api/balance`, `api/points-preview`.  
- Implement signature verification and customer resolution for balance.  
- Add theme extension: app embed (launcher) and one or two blocks (potential points, optional balance block).  
- Test with a theme that supports app blocks/embeds (e.g. Dawn or current store theme).

---

## 6. References

- [MNKY-VERSE-APP-PROXY-SETUP.md](MNKY-VERSE-APP-PROXY-SETUP.md) — Existing proxy config and session/quests/issues routes.
- [GAMIFICATION-TOUCHPOINTS.md](GAMIFICATION-TOUCHPOINTS.md) — Current XP/quest/rewards touch points.
- [GAMIFICATION-GAME-INFRASTRUCTURE.md](GAMIFICATION-GAME-INFRASTRUCTURE.md) — Target flows and balance/redemption.
- Existing blocks: `extensions/mood-mnky-theme/blocks/mnky-assistant-embed.liquid`, `mnky-verse-issue-teaser.liquid` for patterns and schema style.
