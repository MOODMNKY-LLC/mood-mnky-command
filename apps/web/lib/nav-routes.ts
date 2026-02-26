/**
 * Canonical route constants for navigation across Main, Verse (storefront), and Dojo (member hub).
 * Use these in main-nav-config, main footer, and verse header so hrefs stay consistent.
 *
 * Dojo entry points:
 * - Main nav and main footer "Enter the Dojo" / "Dojo" → STOREFRONT (storefront; discover/shop).
 * - Verse header "MNKY DOJO" brand link → DOJO_ME (member home).
 * - Verse header "Dojo" (when signed in) → DOJO_ME (member hub).
 */

export const ROUTES = {
  MAIN: "/main",
  MAIN_ABOUT: "/main/about",
  MAIN_SERVICES: "/main/services",
  MAIN_LOYALTY: "/main/loyalty",
  MAIN_COMMUNITY: "/main/community",
  MAIN_COLLECTIONS_SHOP: "/main/collections/shop",
  MAIN_COLLECTIONS_FRAGRANCES: "/main/collections/fragrances",
  MAIN_COLLECTIONS_FORMULAS: "/main/collections/formulas",
  MAIN_DESIGN: "/main/design",
  MAIN_MEDIA: "/main/media",
  MAIN_SEARCH: "/main/search",
  AUTH_SIGN_UP: "/auth/sign-up",
  AUTH_LOGIN: "/auth/login",
  /** Storefront (shop and blend). Use for Main CTA "Enter the Dojo". */
  STOREFRONT: "/verse",
  /** Dojo portal root. */
  DOJO: "/dojo",
  /** Member hub (profile, chat, crafting). Use in Verse header for "My Dojo". */
  DOJO_ME: "/dojo/me",
  DOJO_BLOG: "/verse/blog",
  DOCS_URL: "https://docs.moodmnky.com",
} as const;
