# MNKY VERSE storefront stack

The MNKY VERSE storefront is built with **Next.js + Hydrogen React** and the Shopify Storefront API. It follows Shopify’s “bring your own stack” approach.

- **Framework:** Next.js (App Router). Storefront routes live under `app/(storefront)/verse/`.
- **Shopify client:** `@shopify/hydrogen-react` — `createStorefrontClient`, `ShopifyProvider`, `CartProvider`, and components such as `CartCheckoutButton`, `useCart`, `useMoney`. See [lib/shopify/storefront-client.ts](../lib/shopify/storefront-client.ts) and [components/verse/verse-providers.tsx](../components/verse/verse-providers.tsx).
- **Credentials:** Storefront API tokens from **Shopify Admin → Hydrogen → MNKY VERSE** (or the Headless channel). Same tokens work with either channel.
- **Deployment:** Next.js on Vercel. Oxygen is not used for this repo.

This is **not** a Remix Hydrogen app. No `pnpm create @shopify/create-hydrogen` or migration to the full Hydrogen (Remix) framework is required. For the full assessment and terminology (Hydrogen vs Hydrogen React), see the project’s Hydrogen vs Next.js headless research and recommendation.
