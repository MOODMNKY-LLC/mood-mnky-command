# Matrix Brand Text — Accessibility and Research Notes

This document summarizes accessibility decisions and research for the **Brand Matrix Text** component, which renders the all-caps brand phrases "MOOD", "MNKY", and "MOOD MNKY" using the ElevenLabs UI Matrix (LED-style grid) across the main site and verse.

## Implementation Summary

- **Component**: `BrandMatrixText` in `apps/web/components/main/elevenlabs/brand-matrix-text.tsx`
- **Glyphs**: 7×5 letter patterns in `apps/web/components/ui/matrix-glyphs.ts` (M, O, D, N, K, Y), composed into static `Frame` patterns for "MOOD", "MNKY", and "MOOD MNKY".
- **Rendering**: Static pattern only (no animation). The Matrix component is used with `pattern` and `autoplay={false}`.

## Accessibility Choices

### Text alternatives

- WCAG and MDN advise that when text is presented in a non-text form (e.g. images or custom visuals), the same information must be available to assistive technologies.
- **Decision**: Each `BrandMatrixText` is rendered with `role="img"` and `aria-label` set to the visible phrase ("MOOD", "MNKY", or "MOOD MNKY"). Screen readers announce the brand text correctly.
- Where the phrase is part of a longer sentence (e.g. "Always scentsing the MOOD." or "Talk to MOOD MNKY"), the surrounding copy is real text and the matrix is a single "img" with that label, so the combined experience is coherent.

### Decorative vs meaningful

- Decorative images should use `alt=""` or be hidden from assistive tech; meaningful content needs a text equivalent.
- **Decision**: The matrix brand text is meaningful (brand name), so we do **not** use `aria-hidden`. We expose it as an image with an explicit label so the brand name is announced.

### Reduced motion

- `prefers-reduced-motion: reduce` should disable or avoid non-essential motion to respect users with vestibular or cognitive sensitivity (WCAG C39, MDN, web.dev).
- **Decision**: The brand matrix text uses a **static pattern only** (no `frames` animation). No motion is applied, so the component already satisfies reduced-motion expectations. If animation were added in the future, it should be gated on `prefers-reduced-motion: no-preference` (e.g. via CSS or a `useReducedMotion`-style check).

### Scrolling “Talk to MOOD MNKY” CTA

- The hero CTA is implemented as **TalkToMoodMnkyMatrixButton**: a button whose content is a Matrix showing the phrase “TALK TO MOOD MNKY” scrolling right-to-left (frames + autoplay + loop). Timing is ~80 ms per step (fps 10–12) for readable motion.
- **Accessibility**: The button has `aria-label="Talk to MOOD MNKY"`; the Matrix inside is `aria-hidden` so the button is the single focusable control. **Reduced motion**: when `prefers-reduced-motion: reduce` is set, the component shows a single static frame (no scroll) and does not autoplay, so the CTA remains usable without motion.

### Theme and contrast

- The default palette uses `hsl(var(--foreground))` for the "on" pixels and a visible muted `off` (e.g. `hsl(var(--muted-foreground) / 0.25)`) per ElevenLabs Matrix docs, so the grid structure is visible and the matrix respects the active theme. No additional contrast tokens were introduced.

## Research References

- **Images of text (WAI)**: Prefer real text + CSS when possible; when using a visual representation of text, provide a text equivalent.
- **C22 (WCAG)**: Using CSS to control visual presentation of text keeps content accessible.
- **C39 (WCAG)**: Using the CSS `prefers-reduced-motion` query to avoid motion for users who request it.
- **MDN – Perceivable**: Content must be presentable in different ways without losing meaning.
- **web.dev – prefers-reduced-motion**: Animations should be disabled or reduced when the user has set a reduced-motion preference.

## Maintenance

- When adding new variants (e.g. "MNKY VERSE" as a single phrase), keep a single source of truth for the pattern and ensure `aria-label` matches the visible phrase.
- If the base Matrix component gains optional animation for brand text, ensure it is disabled when `prefers-reduced-motion: reduce` is active.
