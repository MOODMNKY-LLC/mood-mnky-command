# Main About Us Split Section — Design Research & Layout

## Summary

The About Us page at `/main/about` was redesigned as a **split section** that presents two equal narratives side by side: **The Founder** (Simeon Bowman) and **MOOD MNKY** (the brand / “brain child”). The MOOD MNKY side uses the **3D mascot image** (`/verse/mood-mnky-3d.png`) instead of the flat mascot asset.

## Research Themes

1. **About page dual narrative (founder vs brand)**  
   About pages often serve two goals: a personal story (founder’s journey, motivation) and a brand story (mission, values, offer). Splitting these into distinct areas lets users choose which thread to follow and improves clarity and trust (StoryBrand, BrandVM, Buffer, WebFX).

2. **Split-screen and two-column layout**  
   Split layouts commonly use one side for a fixed message or identity and the other for visuals (founder photos, brand imagery). For solo/founder-led brands, pairing “founder” and “brand” in two panels is a recognized pattern (Slider Revolution, Square Stylist, Hurrdat).

3. **Luxury and character-led brands**  
   Luxury and character-driven brands (e.g. Burberry, Tory Burch, Sheep Inc) combine founder narrative with brand heritage and character. Presenting “the founder” and “the brand” as two faces of the same story supports a premium, human-plus-brand positioning.

4. **Visual balance and hierarchy**  
   Equal-weight panels with clear headings (“The Founder” / “The brain child”), one primary visual per panel (founder photo, mascot), and consistent glass styling keep the layout balanced and aligned with the Main section’s design system.

## Layout Definition

- **Structure:** Single section with a 2-column grid (`grid-cols-1 md:grid-cols-2`), consistent with `MainCustomizationAgentsSplit` and Main spacing (`--main-section-gap`).
- **Left panel — The Founder:** Founder image (shirt), label “The Founder”, name, title, short bio, “Meet the founder” CTA opening the existing founder dialog (hat image, full bio, Get in touch).
- **Right panel — MOOD MNKY:** 3D mascot image (`/verse/mood-mnky-3d.png`), label “The brain child”, brand name, short brand copy, CTAs (Join MNKY VERSE, Blending Guide).
- **Styling:** Main glass panel tokens (`main-glass-panel`, `rounded-2xl`, `border`), BlurFade for entrance, responsive typography and spacing.
- **Accessibility:** Section has an `aria-labelledby` sr-only heading; images have appropriate `alt` text.

## Implementation

- **Component:** `MainAboutSplitSection` in `apps/web/components/main/main-about-split-section.tsx`.
- **Page:** `apps/web/app/(main)/main/about/page.tsx` uses the split as the main content, with a short “About us” intro line.
- **Assets:** Founder panel uses `/images/main/founder-shirt.png`; dialog uses `/images/main/founder-hat.png`. Brand side uses `/verse/mood-mnky-3d.png`.

## References (research synthesis)

- About page best practices and dual narrative: Mockplus, Orbit Media, BrandVM, Buffer, WebFX.
- Split-screen and founder-focused layouts: Slider Revolution, Square Stylist, Hurrdat, Webflow.
- Luxury brand about pages and founder + brand narrative: Burberry, Versace, Tory Burch, Sheep Inc, Miu Miu (character/narrative).
