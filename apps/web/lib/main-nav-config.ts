/**
 * Shared nav and footer link config for the main site (/main).
 * Import in main-nav.tsx and main-footer.tsx so one change updates both.
 */

import { ROUTES } from "./nav-routes";

export const COLLECTIONS_LINKS = [
  { href: ROUTES.MAIN_COLLECTIONS_SHOP, label: "Shop" },
  { href: ROUTES.MAIN_COLLECTIONS_FRAGRANCES, label: "Fragrances" },
  { href: ROUTES.MAIN_COLLECTIONS_FORMULAS, label: "Formulas" },
] as const;

/** Discover: About, Design, Media, Services (what we offer). */
export const ABOUT_LINKS = [
  { href: ROUTES.MAIN_ABOUT, label: "About" },
  { href: ROUTES.MAIN_DESIGN, label: "Design" },
  { href: ROUTES.MAIN_MEDIA, label: "Media" },
  { href: ROUTES.MAIN_SERVICES, label: "Services" },
] as const;

/** Join / Belong: Community, Loyalty, MNKY ID. */
export const JOIN_LINKS = [
  { href: ROUTES.MAIN_COMMUNITY, label: "Community" },
  { href: ROUTES.MAIN_LOYALTY, label: "Loyalty" },
  { href: ROUTES.MAIN_MNKY_ID, label: "MNKY ID" },
] as const;

/** Primary CTA: Enter the Dojo (storefront). */
export const DOJO_CTA = {
  href: ROUTES.STOREFRONT,
  label: "Enter the Dojo",
  tooltip: "Shop and blend in the Dojo",
} as const;

/** Footer link groups: Discover, Dojo, Connect. */
export const FOOTER_GROUPS = {
  discover: [
    { href: ROUTES.MAIN_ABOUT, label: "About" },
    { href: ROUTES.DOJO_BLOG, label: "Blog" },
    { href: ROUTES.DOCS_URL, label: "Docs", external: true },
  ],
  dojo: [
    { href: ROUTES.STOREFRONT, label: "Enter Dojo" },
    { href: ROUTES.AUTH_SIGN_UP, label: "Sign up" },
  ],
  identity: [
    { href: ROUTES.MAIN_MNKY_ID, label: "MNKY ID" },
    { href: ROUTES.MAIN_MNKY_ID_CREATE, label: "Create ID intro" },
    { href: ROUTES.MAIN_MNKY_ID_SIGN_IN, label: "Sign-in options" },
  ],
  connect: { chatQuery: "Tell me about MOOD MNKY – bespoke fragrance and the MNKY DOJO." },
} as const;
