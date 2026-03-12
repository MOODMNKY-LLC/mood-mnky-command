# Jellyfin theme: Ultrachromic 1:1 scope and implementation

This document maps the **Ultrachromic** theme (CTalvio/Ultrachromic) to a 1:1 file representation so we know we cover the full scope when building or updating our Jellyfin theme (mnky.css). The canonical copy of Ultrachromic lives in [infra/service-themes/jellyfin/ultrachromic-reference/](../infra/service-themes/jellyfin/ultrachromic-reference/) (no .git). Use it as reference for selectors, tokens, and structure; our production theme is [infra/service-themes/jellyfin/mnky.css](../infra/service-themes/jellyfin/mnky.css), aligned with the Main design system.

## 1. Import-order and file map (1:1)

The following table lists every file in the order typically used in Custom CSS `@import` (as in the Ultrachromic README and your snippet). Each row is one logical “module” we can implement or mirror in mnky.css.

| Order | @import path (CDN) | Local path (ultrachromic-reference/) | Purpose | Our coverage (mnky.css) |
|-------|--------------------|--------------------------------------|---------|--------------------------|
| 1 | overlayprogress.css | overlayprogress.css | Progress bar overlay on library items | Progress/indicators section; grayscale |
| 2 | titlepage/title_simple.css | titlepage/title_simple.css | Title/detail page layout | Detail page glass + tokens |
| 3 | type/dark.css | type/dark.css | Dark theme colors, --accent (255,255,255) | :root grayscale + light/dark media |
| 4 | cornerindicator/indicator_floating.css | cornerindicator/indicator_floating.css | Watched/unwatched indicator position | Indicators section |
| 5 | fields/fields_noborder.css | fields/fields_noborder.css | Input fields, no border, highlight on focus | Inputs section |
| 6 | login/login_minimalistic.css | login/login_minimalistic.css | Narrow login form, hide prompt, optional bg | Login page centered glass card |
| 7 | episodelist/episodes_compactlist.css | episodelist/episodes_compactlist.css | Compact episode list | Optional; not yet in mnky |
| 8 | rounding_circlehover.css | rounding_circlehover.css | Rounded corners, circle accent on hover | --mnky-glass-radius, button/card radius |
| 9 | base.css | base.css | Base tweaks, progress ring, cards, listItem | Shell, cards, list items, progress |
| 10 | accentlist.css | accentlist.css | Accent color usage (buttons, sliders, focus) | Grayscale primary/muted in mnky |
| 11 | fixes.css | fixes.css | Alignment, sizes, mobile tweaks | Inline where relevant |
| 12 | header/header_transparent.css | header/header_transparent.css | Transparent top bar | Header glass |
| 13 | effects/hoverglow.css | effects/hoverglow.css | Hover glow using --accent | Card hover shadow/lift (grayscale) |
| 14 | effects/glassy.css | effects/glassy.css | Backdrop-filter glass (drawer, dialog, footer) | Glass primitives throughout |
| 15 | effects/pan-animation.css | effects/pan-animation.css | Backdrop pan animation | Optional; not in mnky (can add) |
| 16 | (external) Monochromic/backdrop-hack_style.css | (external; not in repo) | Mobile backdrop hack | Not copied; document only |

**Manual options (snippet):**

- `.backdropImage { filter: blur(18px); }` etc. → Backdrop filters.
- `:root { --accent: 255,255,255; }` → We use `--mnky-primary` / grayscale.
- `:root { --rounding: 12px; }` → We use `--mnky-glass-radius` (1rem); can alias `--rounding` if needed.

## 2. Design tokens (Ultrachromic vs Main/mnky)

| Ultrachromic token | Typical use | Main/mnky equivalent |
|--------------------|-------------|------------------------|
| `--accent` (RGB triple, e.g. 255,255,255) | Buttons, focus, progress, hover glow | `--mnky-primary`, `--mnky-gray-*` (grayscale only) |
| `--selection` | Selection color | `--mnky-primary` or muted |
| `--indicator` | Progress ring, indicators | `--mnky-primary` |
| `--rounding` | Border radius (e.g. 12px) | `--mnky-glass-radius` (1rem) |
| (manual) `.backdropImage` filter | Blur, brightness, contrast, saturate | Optional in mnky; we use .mainBackdrop / .backgroundContainer |

Our theme uses **grayscale only** (Main design system); we do not use a colored `--accent` in production. If we ever add an accent for a variant, it would live in theme configurations.

## 3. Per-module implementation notes

- **overlayprogress** – Overlay progress bar on item cards. We style progress via `.progressBar`, `.itemProgressBar`, `.playedIndicator` with mnky tokens.
- **title_simple** – Detail/title page layout. We use `.detailPage`, `.detailPageContentContainer`, `.detailImageContainer` with glass and spacing.
- **type/dark** – Sets `--accent` and `--selection`; dark backgrounds and tables. We use `:root` + `@media (prefers-color-scheme: light)` with `--mnky-*`.
- **indicator_floating** – Positions watched/unwatched indicator. We target `.playedIndicator`, `.countIndicator` with grayscale.
- **fields_noborder** – Inputs: no border until focus, then highlight. We use `.emby-input` with glass border and focus states.
- **login_minimalistic** – `#loginPage .readOnlyContent`, `form` max-width 22em; hide h1; optional background. We use centered glass card with multiple selectors for version compatibility.
- **episodes_compactlist** – Compact episode list layout. Can add in a future iteration if desired.
- **rounding_circlehover** – Global rounding and circle hover accent. We use `--mnky-glass-radius` and consistent border-radius on buttons/cards.
- **base** – Progress ring, cards, listItem, homeLibraryButton, etc. We cover shell, cards, buttons, list items in mnky.
- **accentlist** – All accent-colored elements (focus, hover, sliders). We use grayscale primary/muted for the same elements.
- **fixes** – Small layout/alignment tweaks. We apply similar fixes where they align with Main.
- **header_transparent** – `.skinHeader-withBackground { background: transparent }` and margin-top for content. We use header glass (semi-transparent) and spacing.
- **hoverglow** – Box-shadow and border on hover using `rgba(var(--accent))`. We use `--mnky-card-hover-shadow` and lift.
- **glassy** – `backdrop-filter: blur(15px)` on header, drawer, dialog, toast, footer. We use `--mnky-glass-*` and `@supports` fallback.
- **pan-animation** – Backdrop pan keyframes. Optional; can add with `prefers-reduced-motion` respect.

## 4. Reference locations

- **Canonical Ultrachromic copy:** [infra/service-themes/jellyfin/ultrachromic-reference/](../infra/service-themes/jellyfin/ultrachromic-reference/)
- **Our theme:** [infra/service-themes/jellyfin/mnky.css](../infra/service-themes/jellyfin/mnky.css)
- **Design baseline:** [JELLYFIN-THEME-BASELINE.md](JELLYFIN-THEME-BASELINE.md)
- **Theme configurations:** [JELLYFIN-THEME-CONFIGURATIONS.md](JELLYFIN-THEME-CONFIGURATIONS.md)
- **Main design system:** [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md), main-site.css, main-glass.css

## 5. Updating the canonical copy

To refresh the Ultrachromic reference from the cloned repo:

```bash
# From repo root; exclude .git
robocopy temp\Ultrachromic infra\service-themes\jellyfin\ultrachromic-reference /E /XD .git .github /NFL /NDL /NJH /NJS
```

Or copy manually excluding `.git` and `.github` so we only keep CSS and README/LICENSE.
