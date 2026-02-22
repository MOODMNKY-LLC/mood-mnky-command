/**
 * About Us copy: founder and MOOD MNKY brand.
 * Single source for /main/about split section and founder dialog.
 * Update from docs/ABOUT-US-INTERVIEW.md after the founder completes the questionnaire.
 */

export const MAIN_ABOUT_FOUNDER = {
  name: "Simeon Bowman",
  title: "Founder & CEO",
  org: "MOOD MNKY LLC",
  /** Short bio for the split panel card (1–2 sentences). */
  panelBio:
    "Simeon Bowman founded MOOD MNKY LLC to bring together bespoke fragrance, community, and innovation in the MNKY VERSE.",
  /** Full bio for the “Meet the founder” dialog (2–4 sentences). */
  dialogBio:
    "Simeon Bowman is the founder and CEO of MOOD MNKY LLC and the MOOD MNKY brand, bringing together bespoke fragrance, community, and innovation in the MNKY VERSE.",
  /** CTA label in founder dialog; link target is /main/contact. */
  ctaLabel: "Get in touch",
  ctaHref: "/main/contact",
} as const

export const MAIN_ABOUT_BRAND = {
  /** Short copy for the “The brain child” panel (2–3 sentences). */
  panelBio:
    "MOOD MNKY is a technological organism that integrates physical products, digital experiences, and AI-driven personalization to transform self-care from a meaningful journey. We bring together bespoke fragrance, community, and innovation in the MNKY VERSE.",
  /** Meta description for /main/about (SEO, social). */
  metaDescription:
    "Learn about MOOD MNKY, bespoke fragrance, and the MNKY VERSE community.",
} as const
