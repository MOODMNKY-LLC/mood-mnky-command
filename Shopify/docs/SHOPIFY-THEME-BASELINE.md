# Shopify theme design baseline

This document is the **design baseline** for the MNKY VERSE Shopify theme: how to edit it, where design lives, token flow, and a per-component file/class reference. Use it with [README.md](README.md), [shopify-cli-commands.md](shopify-cli-commands.md), and the repo [DESIGN-SYSTEM.md](../../docs/DESIGN-SYSTEM.md) (Shopify theme subsection).

## 1. Ways to edit

| Aspect | Detail |
|--------|--------|
| **Theme Editor** | **Customize** (Admin → Online Store → Themes → Customize) for sections, colors, fonts, and block content. Changes persist to `config/settings_data.json` and to section JSON inside templates (e.g. `templates/index.json`). |
| **Repo (Liquid/JSON/CSS)** | Edit `layout/`, `sections/`, `snippets/`, `config/`, `assets/` in the repo. Deploy with `shopify theme push --path Shopify/theme --store mood-mnky-3.myshopify.com` (use `--unpublished` to push as a new theme, or `--allow-live` to overwrite live). |
| **Pull after Editor changes** | If you change colors or section order in the Theme Editor, run `shopify theme pull --path Shopify/theme --store mood-mnky-3.myshopify.com --live` to persist those changes back into the repo. See [PRODUCTION-THEME-REVIEW.md](PRODUCTION-THEME-REVIEW.md). |

Reference: [shopify-cli-commands.md](shopify-cli-commands.md) (pull, push, dev, check).

## 2. Where design lives

### Layout (theme.liquid)

- **File:** [Shopify/theme/layout/theme.liquid](../../theme/layout/theme.liquid).
- **Inline `{% style %}` block:** Outputs per–color-scheme CSS (e.g. `.color-background-1 { --color-background: ...; --color-foreground: ...; }`) and global tokens: `--font-body-family`, `--font-heading-family`, `--page-width`, `--buttons-radius`, `--product-card-corner-radius`, spacing, shadows, etc. The first scheme is also applied to `:root`.
- **Glass variables (when enabled):** When `settings.glass_style_enabled` is true, the same block sets `--glass-bg-alpha`, `--glass-blur`, `--glass-border-alpha`, `--glass-shadow` in `:root`. These are consumed by [assets/component-glass.css](../../theme/assets/component-glass.css).
- **Stylesheet order:** After the inline block, the layout loads `base.css`, `component-glass.css`, `theme-app-bridge.css`.

### Config

- **Settings schema:** [Shopify/theme/config/settings_schema.json](../../theme/config/settings_schema.json) defines theme options, including **color_schemes** (background, text, button, button_label, secondary_button_label, shadow) and **Glass style** (glass_style_enabled, glass_blur, glass_opacity).
- **Current values:** [Shopify/theme/config/settings_data.json](../../theme/config/settings_data.json) holds the active values (e.g. `current.color_schemes.background-1`, `current.type_header_font`). The Theme Editor writes here. Re-pulling from live overwrites this file with whatever is on the store.

### Assets

- **component-glass.css:** Implements glass panels using `rgba(var(--color-background), var(--glass-bg-alpha, 0.15))`, `--glass-blur`, `--glass-border-alpha`, `--glass-shadow`. Targets announcement bar (`.utility-bar.glass-panel`), sticky header (`.section-header.shopify-section-header-sticky .header-wrapper`), slideshow banner text box, cards (`.card--glass`), cart drawer, menu drawer.
- **base.css:** Refresh theme base styles (typography, layout, components). Not customized per design system; overrides live in component-glass.css and layout-injected vars.

## 3. Token flow

- **Color schemes:** Values in `config/settings_data.json` under `current.color_schemes` (e.g. `background-1`, `inverse`) are output by the layout’s Liquid loop. Each scheme gets a class `.color-<scheme.id>` with CSS variables: `--color-background`, `--color-foreground`, `--color-button`, `--color-button-text`, `--color-link`, etc. (RGB triplets for use in `rgba(var(--color-background), 0.15)`).
- **Sections:** Each section (or block) that supports a color scheme applies `color-{{ section.settings.color_scheme }}` (e.g. `color-background-1`) so that block uses that scheme’s variables.
- **Body:** The `<body>` has `data-theme="dark"` (or `"light"` from localStorage). There is no body-level color scheme class; the main content area and header/footer get their scheme from the section’s `color-*` class.

## 4. File / component map

| Component or area | File(s) | Main classes / notes |
|-------------------|---------|----------------------|
| **Announcement bar** | `sections/announcement-bar.liquid` | `utility-bar`, `utility-bar--light-glass`, `glass-panel`, `color-{{ section.settings.color_scheme }}` |
| **Header** | `sections/header.liquid` | `header-wrapper`, `color-{{ section.settings.color_scheme }}`, sticky header gets glass from component-glass.css |
| **Footer** | `sections/footer.liquid` | `footer`, `color-{{ section.settings.color_scheme }}` |
| **Slideshow** | `sections/slideshow.liquid` | `banner`, `banner__box`, `content-container`, `color-{{ block.settings.color_scheme }}`; glass on text box (component-glass.css) |
| **Image banner** | `sections/image-banner.liquid` | `banner__box`, `content-container`, `color-{{ section.settings.color_scheme }}` |
| **Product grid / featured collection** | `sections/featured-collection.liquid`, `snippets/card-product.liquid` | `color-{{ section.settings.color_scheme }}`; card style (standard/glass) from settings |
| **Cards (product, collection, blog)** | `snippets/card-product.liquid`, `card-collection.liquid`; sections set `card_color_scheme` | `card`, `card--glass` (when Glass style), `card__inner`; glass in component-glass.css |
| **Cart drawer** | `sections/cart-drawer.liquid` (snippet) | `cart-drawer`, `drawer`, `drawer__inner`; glass in component-glass.css |
| **Menu drawer** | Header / global | `menu-drawer`, `menu-drawer__submenu`; glass in component-glass.css |
| **Rich text / app CTA** | `sections/rich-text.liquid`, `sections/app-cta.liquid` | `rich-text`, `content-container`, `color-{{ section.settings.color_scheme }}` |
| **Featured blog** | `sections/featured-blog.liquid` | `blog`, `color-{{ section.settings.color_scheme }}`; cards use `blog_card_color_scheme` |
| **Newsletter** | `sections/newsletter.liquid` | `newsletter__wrapper`, `color-{{ section.settings.color_scheme }}` |
| **Main product page** | `sections/main-product.liquid` | `color-{{ section.settings.color_scheme }}` |
| **Collection list / main collection** | `sections/collection-list.liquid`, `main-collection-product-grid.liquid`, `main-collection-banner.liquid` | `color-{{ section.settings.color_scheme }}` |
| **Multicolumn** | `sections/multicolumn.liquid` | `multicolumn`, `color-{{ section.settings.color_scheme }}` |
| **Image with text** | `sections/image-with-text.liquid` | `section_color_scheme`, `row_color_scheme`, `color_scheme` per block |
| **Collapsible content** | `sections/collapsible-content.liquid` | `color-{{ section.settings.color_scheme }}`, `container_color_scheme` |
| **Apps section (app blocks)** | `sections/apps.liquid` | Layout wrapper; blocks from Theme App Extension |

## 5. Theme Check and deploy

- **Lint:** Run `shopify theme check --path Shopify/theme` before pushing. Fix any reported Liquid or schema issues.
- **Verification (baseline alignment):** After the design updates in this repo, theme check was run. The only change that had triggered a check error was `settings_schema.json` glass opacity range step (must be divisible by 0.1); it was set to `step: 0.1`, `default: 0.2`. Other reported errors (e.g. MatchingTranslations for card "Glass" option, LiquidHTMLSyntaxError, ParserBlockingScript, ContentForHeaderModification) are pre-existing in the pulled theme and are out of scope for the baseline/design alignment pass.
- **Preview:** `shopify theme dev --path Shopify/theme --store mood-mnky-3.myshopify.com` for local preview with hot reload.
- **Push:**  
  - Unpublished: `shopify theme push --path Shopify/theme --store mood-mnky-3.myshopify.com --unpublished`  
  - Live (overwrite): `shopify theme push --path Shopify/theme --store mood-mnky-3.myshopify.com --live --allow-live`
- **Pull after Editor edits:** To bring Theme Editor changes (e.g. section order, color tweaks) into the repo, run `shopify theme pull --path Shopify/theme --store mood-mnky-3.myshopify.com --live`. See [PRODUCTION-THEME-REVIEW.md](PRODUCTION-THEME-REVIEW.md).

## 6. Design system alignment

The storefront is aligned with the **Main** design system (grayscale, glassmorphism). Default color schemes and glass variables are set to match [DESIGN-SYSTEM.md](../../docs/DESIGN-SYSTEM.md) and the Main section tokens in `apps/web/app/(main)/main/main-site.css` and `main-glass.css`.

- **Color schemes:** `current.color_schemes` in `settings_data.json` use grayscale only (e.g. background-1 dark: ~6% black, inverse light: white background). Desired values are documented in DESIGN-SYSTEM.md (Shopify theme subsection); if you re-pull from the Theme Editor and overwrite `settings_data.json`, re-apply those values or copy from this baseline.
- **Glass:** When glass style is enabled, `--glass-blur`, `--glass-bg-alpha`, `--glass-border-alpha`, `--glass-shadow` (and optional `--glass-radius`) match Main-equivalent values. See DESIGN-SYSTEM.md and layout/theme.liquid `:root` block.

## 7. References

- **Repo:** [DESIGN-SYSTEM.md](../../docs/DESIGN-SYSTEM.md) (Main section + Shopify theme subsection), [PRODUCTION-THEME-REVIEW.md](PRODUCTION-THEME-REVIEW.md)
- **Shopify:** [Shopify CLI for themes](https://shopify.dev/docs/storefronts/themes/tools/cli), [Theme architecture](https://shopify.dev/docs/themes/architecture)
