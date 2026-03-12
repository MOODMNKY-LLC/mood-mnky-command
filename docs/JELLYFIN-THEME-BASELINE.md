# Jellyfin theme design baseline

This document is the **design baseline** for Jellyfin theming: how Custom CSS is applied, what can be overridden, our design tokens, and a per-component selector list so themes can be designed and updated reliably. Use it together with [JELLYFIN-THEME-CONFIGURATIONS.md](JELLYFIN-THEME-CONFIGURATIONS.md) and [JELLYFIN-THEMING.md](JELLYFIN-THEMING.md).

## 1. Ways to visually edit

| Aspect | Detail |
|--------|--------|
| **Where** | Jellyfin **Dashboard → General → Custom CSS**. Optional server-side branding Custom CSS (branding options). |
| **Content** | Raw CSS or `@import url("...")` (e.g. Supabase theme URL: `themes/latest/mnky-media/mnky.css`). |
| **Order** | Base Jellyfin styles → theme imports (if any) → your overrides. “Last rule wins” subject to specificity. |
| **Specificity** | Use `!important` when base or MUI styles would otherwise win. |
| **Scope** | Web client and Android client. Save settings and reload; no server restart. |

Reference: [Jellyfin CSS customization](https://jellyfin.org/docs/general/clients/css-customization). See also [temp/JELLYFIN-CSS-CUSTOMIZATION-OFFICIAL-SUMMARY.md](../temp/JELLYFIN-CSS-CUSTOMIZATION-OFFICIAL-SUMMARY.md) in this repo.

### Levels of control

- **Level 1 – Server-wide Custom CSS (recommended for "auth in a card", colors, spacing, glass):** Where: Dashboard → General → Custom CSS (sometimes labeled "Custom Style"; location can vary by Jellyfin version). What it can do: Override styles, typography, colors, layout (flex/center), hide elements, make login look like a card. No DOM changes. Our approach: Single theme file served from Supabase; `@import` in Custom CSS field. All current mnky.css overrides are Level 1.
- **Level 2 – Theme packs via @import + Skin Manager:** Pattern: `@import` a maintained theme (e.g. ElegantFin, JellySkin) then layer our overrides. Skin Manager plugin can help switch skins. Still CSS-only; easier to swap themes than one giant stylesheet. We currently use a single custom theme (mnky.css) rather than importing a third-party base.
- **Level 3 – Custom web client (full granularity):** For structural changes: split-screen login, new panels, rearranged navigation, custom auth flows. Requires building/forking [jellyfin-web](https://github.com/jellyfin/jellyfin-web) and deploying that build (or replacing served web assets). Config via `config.json` in web root. Caveats: Updates overwrite edits; use a repeatable build/deploy (e.g. Docker volume, CI). Plugins generally cannot inject arbitrary JS into core pages.
- **Recommendation:** Use Level 1 (Custom CSS) for auth card and visual polish; consider Level 2 for a quick style uplift with a community theme; use Level 3 only when DOM/structure must change.

## 2. Design tokens

### Our tokens (`:root` in mnky.css)

We define **`--mnky-*`** in the theme so all primitives reference a single design contract (aligned with Main: [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md), main-site.css, main-glass.css).

- **Grayscale:** `--mnky-gray-50` … `--mnky-gray-950` (HSL 0 0% lightness).
- **Background / text:** `--mnky-bg`, `--mnky-bg-soft`, `--mnky-text`, `--mnky-text-muted`, `--mnky-primary`, `--mnky-primary-foreground`.
- **Glass:** `--mnky-glass-blur`, `--mnky-glass-blur-soft`, `--mnky-glass-radius`, `--mnky-glass-radius-lg`, `--mnky-glass-shadow`, `--mnky-glass-bg`, `--mnky-glass-bg-card`, `--mnky-glass-border`, `--mnky-glass-bg-nav`, `--mnky-glass-border-nav`, `--mnky-glass-bg-sidebar`, `--mnky-glass-border-sidebar`, `--mnky-glass-radius-sidebar`, `--mnky-glass-bg-solid`.
- **Motion:** `--mnky-float-offset`, `--mnky-float-shadow`, `--mnky-float-duration`, `--mnky-card-hover-shadow`.
- **Logo:** `--mnky-logo-url` (used in pseudo-element for logo override).

**How to change design:** Edit the token values in [infra/service-themes/jellyfin/mnky.css](infra/service-themes/jellyfin/mnky.css) (`:root` and optional `@media (prefers-color-scheme: light)`). Ensure primitives use tokens, not hard-coded values.

### Jellyfin’s theme layer

jellyfin-web has `src/themes/` (TypeScript/SCSS: defaults, theme definitions, UserThemeProvider). The **Custom CSS field does not modify those variables**; it injects a separate stylesheet. We override appearance by **targeting the same classes** Jellyfin (and MUI) use, with our `--mnky-*` values and `!important` where needed.

## 3. Extent of CSS

| Can override | Notes |
|--------------|--------|
| Colors, backgrounds, borders, shadows | Yes; use tokens or hex/rgba. |
| Backdrop-filter (frosted glass) | Yes; include `-webkit-backdrop-filter` and `@supports not (backdrop-filter)` fallback. |
| Layout (max-width, padding, flex) | Yes. |
| Typography (font-family, size, weight) | Yes. |
| MUI-generated classes | Yes; target `.MuiDrawer-paper`, `.MuiPaper-root`, etc. |

**Caveats:** Inline styles or JS-set styles may require `!important` or higher specificity. MUI uses class names (e.g. `.MuiDrawer-root`, `.MuiPaper-root`); we target those when the app does not add custom class names. After jellyfin-web upgrades, re-verify selectors (see Section 5).

## 4. Comprehensive selector list (per component)

Use this table to know **which selectors to use** for each part of the UI. If a style does not apply, confirm in the live DOM (DevTools) that the selector matches; see Section 5.

| Component | Selectors to use | Source / note |
|-----------|-------------------|----------------|
| **Logo** | `.imgLogoIcon`, `.headerLogo`, `.headerLeft`, `.headerLogo::after`, `.headerLeft::after` | Community / jellyfin-web; parent ::after for robust replacement. |
| **Background** | `.backgroundContainer` | jellyfin-web / Ultrachromic. |
| **Shell** | `.dashboard-app-shell` | jellyfin-web. |
| **Header** | `.dashboard-header`, `.headerTop` | jellyfin-web. |
| **Sidebar / drawer** | `.sidebarContent`, `.paperList`, `.mainDrawer`, `.mainDrawer .drawerContent`, `#drawer .drawerContent`, **`.MuiDrawer-root .MuiPaper-root`**, **`.MuiDrawer-paper`**, **`[class*="MuiDrawer"] [class*="MuiPaper"]`** | Legacy + **MUI** (jellyfin-web ResponsiveDrawer). Sidebar transparency requires MUI selectors on current builds. |
| **Cards / tiles** | `.dashboard-gs-generic-item`, `.paperList .listItem`, `.cardContent` | jellyfin-web. |
| **Now Playing** | `.nowPlayingBar`, `.nowPlayingBarTop` | jellyfin-web. |
| **Detail page** | `.detailPage`, `.detailPageContentContainer`, `.detailImageContainer`, `.detailPage .cardContent` | jellyfin-web. |
| **Section titles** | `.sectionTitleContainer`, `.sectionTitleContainer a`, `.sectionTitle` | Official docs / jellyfin-web. |
| **Indicators** | `.playedIndicator`, `.countIndicator` | Official docs. |
| **Progress** | `.progressBar`, `.progressBarInner`, `.sliderContainer .slider`, `.sliderContainer .sliderTrack` | jellyfin-web. |
| **Buttons** | `.btnPlay`, `.emby-button`, `.emby-button-primary`, `[data-id="playButton"]`, `.button-primary`, `.emby-button:not(.emby-button-primary)` | jellyfin-web / official. |
| **Inputs** | `.emby-input`, `.emby-textarea`, `.emby-select`; labels: `.inputLabel`, `.formDialogLabel` | Official docs. |
| **Login** | `#loginPage`, `#loginPage::before`, `#loginPage .readOnlyContent`, `#loginPage .formDialogContent`, `#loginPage form`, `#loginPage .visualLoginForm`, `#loginPage .padded-left.padded-right.padded-bottom-page`, `#loginPage h1`, `#loginPage #divUsers .card` | jellyfin-web / Ultrachromic; inner container varies by version—see Section 5. |
| **Typography** | `.bodyText`, `.listItemBodyText`, `.secondary` | jellyfin-web. |

## 5. Selector verification

When a style does not take effect (e.g. sidebar transparency):

1. **Browser DevTools:** Open Jellyfin in the browser → right-click the element (e.g. sidebar) → Inspect. Note the **class names** on the element and its container. If you see `MuiDrawer-paper` or `MuiPaper-root`, our MUI rules should apply; if you see different names, add those to [infra/service-themes/jellyfin/mnky.css](infra/service-themes/jellyfin/mnky.css) and document them here.
2. **jellyfin-web source:** Clone [jellyfin/jellyfin-web](https://github.com/jellyfin/jellyfin-web), open the component that renders the area (e.g. `src/components/ResponsiveDrawer.tsx`), and check for `className`, `id`, or MUI `classes` prop. MUI components generate names like `MuiDrawer-root`, `MuiDrawer-paper`, `MuiPaper-root`.
3. **Login-specific:** If the login card style does not apply: open Jellyfin web → login page → right-click the form → Inspect → find the wrapper element that should be the single card (often the direct parent of the form or user list). Note its IDs/classes and add a selector for that element in [infra/service-themes/jellyfin/mnky.css](infra/service-themes/jellyfin/mnky.css) (same glass rules as existing `#loginPage .readOnlyContent`, etc.). Document the selector in the baseline table (Login row) if it is a new stable target.

After a jellyfin-web upgrade, re-run verification for any component that stops matching.

## 6. References

- **Official:** [Jellyfin CSS customization](https://jellyfin.org/docs/general/clients/css-customization)
- **Repo:** [CHAT-GPT-JELLYFIN-THEME-GUIDE.md](../CHAT-GPT-JELLYFIN-THEME-GUIDE.md), [JELLYFIN-THEMING.md](JELLYFIN-THEMING.md), [JELLYFIN-THEME-CONFIGURATIONS.md](JELLYFIN-THEME-CONFIGURATIONS.md)
- **jellyfin-web:** [src/themes](https://github.com/jellyfin/jellyfin-web/tree/master/src/themes), [ResponsiveDrawer](https://github.com/jellyfin/jellyfin-web/blob/master/src/components/ResponsiveDrawer.tsx), [CustomCss](https://github.com/jellyfin/jellyfin-web/blob/master/src/components/CustomCss.tsx)
- **Summary in repo:** [temp/JELLYFIN-CSS-CUSTOMIZATION-OFFICIAL-SUMMARY.md](../temp/JELLYFIN-CSS-CUSTOMIZATION-OFFICIAL-SUMMARY.md)
- **Reference files from live server:** Built web client files (CSS, themes, index.html) pulled from the TrueNAS Jellyfin container are in [temp/jellyfin-web-from-server/](../temp/jellyfin-web-from-server/) for selector and cascade reference (pulled 2026-02-23). Use `themes/`, `session-login*.css`, and `main.jellyfin.*.css` when verifying or extending selectors.
- **Ultrachromic 1:1 scope and canonical copy:** [JELLYFIN-ULTRACHROMIC-SCOPE.md](JELLYFIN-ULTRACHROMIC-SCOPE.md) maps each Ultrachromic module to our coverage and lists design tokens. A canonical copy of Ultrachromic (CSS only, no .git) is in [infra/service-themes/jellyfin/ultrachromic-reference/](../infra/service-themes/jellyfin/ultrachromic-reference/) for reference when building or extending the theme.
