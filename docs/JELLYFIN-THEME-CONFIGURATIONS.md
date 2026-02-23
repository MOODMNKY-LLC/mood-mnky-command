# Jellyfin theme configurations

This document lists **named theme configurations** for the MNKY Jellyfin theme. Use it during design iterations to find the right token or section to change without reinventing the wheel.

Reference: [infra/service-themes/jellyfin/mnky.css](../infra/service-themes/jellyfin/mnky.css). See [JELLYFIN-THEMING.md](JELLYFIN-THEMING.md) for publish steps and design mapping; [JELLYFIN-THEME-BASELINE.md](JELLYFIN-THEME-BASELINE.md) for selector list and verification.

---

## Configuration table

| Configuration | Purpose | Options / values | Location in theme |
|---------------|---------|------------------|-------------------|
| **glass-intensity** | Frosted panel opacity and blur strength | soft (lower opacity) / default / strong (higher opacity, use `--mnky-glass-bg-card-strong`) | `--mnky-glass-bg`, `--mnky-glass-blur`, `--mnky-glass-bg-card`, `--mnky-glass-bg-card-strong` |
| **grayscale-palette** | Base light/dark bias | dark-first (default `:root`) / light-first / system (`prefers-color-scheme`) | `:root` block vs `@media (prefers-color-scheme: light)` |
| **card-hover** | Tile/card hover behavior | lift (translateY + shadow) / shadow-only / none (remove transform and transition) | `--mnky-float-offset`, `--mnky-card-hover-shadow`, `.dashboard-gs-generic-item:hover`, `.paperList .listItem:hover` |
| **border-radius** | Global roundness | sharp (`0`) / default (`1rem`) / rounded-lg (`1.25rem`, cards/shell) / pill (`2rem`) | `--mnky-glass-radius`, `--mnky-glass-radius-lg`, `--mnky-glass-radius-sidebar` |
| **sidebar** | Sidebar / drawer style | solid / glass (~50% opacity, frosted, higher contrast, rounded) | `--mnky-glass-bg-sidebar`, `--mnky-glass-border-sidebar`, `--mnky-glass-radius-sidebar`; legacy: `.sidebarContent`, `.mainDrawer`, `.drawerContent`; **MUI:** `.MuiDrawer-root .MuiPaper-root`, `.MuiDrawer-paper`. If transparency still missing, verify in DOM (see [JELLYFIN-THEME-BASELINE.md](JELLYFIN-THEME-BASELINE.md#5-selector-verification)). |
| **typography** | Font stack | system (default) / space-grotesk (uncomment `@import` and set `--mnky-font`) / roc-grotesk (if self-hosted) | Top-of-file `@import` (optional), `:root { --mnky-font }`, `.dashboard-app-shell` font-family |
| **logo** | Logo override | none (commented) / Supabase asset + robust override (Option A: `.headerLogo` or `.headerLeft` parent ::after; Option C: `content: url()`) | `.imgLogoIcon`, `.headerLogo`, `.headerLeft`, `::after`; `--mnky-logo-url`; see [JELLYFIN-THEMING.md](JELLYFIN-THEMING.md#logo-override-robust-method) |
| **now-playing-bar** | Now Playing bar style | default (Jellyfin stock) / glass (current) / minimal (lighter border, less shadow) | `.nowPlayingBar`, `.nowPlayingBarTop` |
| **animation** | Motion level | none (remove or set `animation: none`) / subtle (current: `mnky-fade-in` on shell) / pronounced (add scale or longer duration) | `@keyframes mnky-fade-in`, `.dashboard-app-shell` animation, `@media (prefers-reduced-motion: reduce)` |
| **indicators** | Played/watched and count indicators | grayscale-primary (current) / grayscale-muted (use `--mnky-text-muted`) / hidden (`display: none`) | `.playedIndicator`, `.countIndicator` |
| **login-style** | Login page | solid (bg only) / glass-card (current: centered glass card, narrow `max-width: 24em`, Main tokens) | Selectors are version-dependent; inner container varies by jellyfin-web. See [JELLYFIN-THEME-BASELINE.md](JELLYFIN-THEME-BASELINE.md) (Login row, Section 5) to verify/add selectors. Theme: `#loginPage`, `.readOnlyContent`, `.formDialogContent`, `form`, `.visualLoginForm`, `.padded-left.padded-right.padded-bottom-page`, etc.; [JELLYFIN-THEMING.md](JELLYFIN-THEMING.md#login-page-centered-glass-card). |
| **section-titles** | Section header look | default (current: `--mnky-text`) / uppercase (`text-transform: uppercase`) / muted (`--mnky-text-muted`) | `.sectionTitleContainer`, `.sectionTitle` |
| **glass-shadow** | Panel shadow depth | soft / default / strong | `--mnky-glass-shadow`, `--mnky-float-shadow`, `--mnky-card-hover-shadow` |
| **entrance** | Shell/card entrance | none / fade-in (current on shell) / fade-in + cards (add same animation to cards) | `@keyframes mnky-fade-in`, `.dashboard-app-shell`, optional `.dashboard-gs-generic-item` |

---

## Quick reference: token names

- **Background / text:** `--mnky-bg`, `--mnky-bg-soft`, `--mnky-text`, `--mnky-text-muted`, `--mnky-primary`, `--mnky-primary-foreground`
- **Grayscale scale:** `--mnky-gray-50` … `--mnky-gray-950`
- **Glass:** `--mnky-glass-blur`, `--mnky-glass-blur-soft`, `--mnky-glass-radius`, `--mnky-glass-radius-lg`, `--mnky-glass-shadow`, `--mnky-glass-bg`, `--mnky-glass-bg-soft`, `--mnky-glass-bg-card`, `--mnky-glass-bg-card-strong`, `--mnky-glass-border`, `--mnky-glass-bg-nav`, `--mnky-glass-border-nav`, `--mnky-glass-bg-sidebar`, `--mnky-glass-border-sidebar`, `--mnky-glass-radius-sidebar`, `--mnky-glass-bg-solid`
- **Motion:** `--mnky-float-offset`, `--mnky-float-shadow`, `--mnky-float-duration`, `--mnky-card-hover-shadow`
- **Font:** `--mnky-font`

---

## References

- [JELLYFIN-THEMING.md](JELLYFIN-THEMING.md) — Design mapping, publish, CORS
- [JELLYFIN-THEME-BASELINE.md](JELLYFIN-THEME-BASELINE.md) — Ways to edit, tokens, extent of CSS, per-component selectors, verification
- [JELLYFIN-ULTRACHROMIC-SCOPE.md](JELLYFIN-ULTRACHROMIC-SCOPE.md) — Ultrachromic 1:1 file map, token mapping, per-module implementation notes; canonical reference: infra/service-themes/jellyfin/ultrachromic-reference/
- [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) — Main section tokens (source of truth for alignment)
