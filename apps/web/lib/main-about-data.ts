/**
 * About Us copy: founder and MOOD MNKY brand.
 * Single source for /main/about split section and founder dialog.
 * Updated from docs/ABOUT-US-INTERVIEW.md after founder interview completion.
 */

export const MAIN_ABOUT_FOUNDER = {
  name: "Simeon Bowman | Founder & Architect",
  title: "Founder & Architect",
  org: "MOOD MNKY LLC",
  /** Short bio for the split panel card (1–2 sentences). */
  panelBio:
    "Simeon Bowman is the Founder & Architect of MOOD MNKY — a customization-first infrastructure spanning scent, software, and deliberate design. His work holds that individuality is not something to correct or contain, but to celebrate — while the systems surrounding it are built with precision, depth, and respect.",
  /** Full bio for the “Meet the founder” dialog (2–4 sentences). */
  dialogBio:
    "Simeon Bowman founded MOOD MNKY from a conviction that refinement and dignity are not reserved for a particular background. Long drawn to design, ritual, and the structure behind experience, he approaches customization as a systems discipline — one that treats environment, scent, and software as deliberate tools rather than decoration.\n\nThe intensity of the pandemic era clarified that philosophy, transforming private experimentation into a broader architectural pursuit. Today, MOOD MNKY operates as a customization-first infrastructure — crafting bespoke experiences that elevate without spectacle and celebrate individuality without qualification.",
  /** CTA label in founder dialog; link target is /main/contact. */
  ctaLabel: "Get in touch",
  ctaHref: "/main/contact",
} as const

export const MAIN_ABOUT_BRAND = {
  /** Short copy for the “The brain child” panel (2–3 sentences). */
  panelBio:
    "MOOD MNKY operates as a customization-first infrastructure integrating scent, grooming, software, and community into a unified experience. What appears playful at the surface is built on deliberate systems beneath it — merging physical refinement with digital precision. It is where individuality meets architecture.",
  /** Meta description for /main/about (SEO, social). */
  metaDescription:
    "MOOD MNKY is a customization-first ecosystem blending scent, grooming, and digital tools into an accessible, community-driven refinement experience.",
} as const