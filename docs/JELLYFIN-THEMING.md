# Jellyfin theming (MNKY MEDIA)

This document describes how we build, publish, and serve a Jellyfin Custom CSS theme that matches the **Main** section design system (www.moodmnky.com/main): grayscale, glassmorphism, and the same tokens as `main-site.css` and `main-glass.css`. It summarizes the approach from [CHAT-GPT-JELLYFIN-THEME-GUIDE.md](../CHAT-GPT-JELLYFIN-THEME-GUIDE.md) and ties it to the repo’s existing infra.

## Summary of the ChatGPT guide

- **Where CSS lives:** Jellyfin Dashboard → General → Custom CSS. That field overrides the web client’s default CSS. Order: base Jellyfin styles → theme imports (e.g. Ultrachromic) → your custom overrides.
- **Levels of control:** Three levels apply—Level 1 (Custom CSS, recommended for auth card and visual polish), Level 2 (theme packs / Skin Manager), Level 3 (custom jellyfin-web build for structural changes). See [JELLYFIN-THEME-BASELINE.md](JELLYFIN-THEME-BASELINE.md#levels-of-control) for details.
- **Layers:** (1) Optional base theme (e.g. Ultrachromic modules from jsDelivr or local vendor). (2) Your `:root` tokens (design system contract). (3) Primitives: background, shell, header, card, buttons, inputs, typography. (4) Page-specific overrides (login, episode list, now playing) with minimal, stable selectors.
- **Supabase as CDN:** Final CSS is hosted in Supabase Storage; Jellyfin imports it via `@import url("...")`. Use versioned or stable “latest” URLs and configure CORS for Jellyfin domains.
- **Versioning:** Optional supply chain can track jellyfin-web releases, build per version, upload via Edge Function (HMAC), and record builds in DB.

## Current state in this repo

| Item | Location / command |
|------|-------------------|
| Theme source | `infra/service-themes/jellyfin/mnky.css` |
| Publish (local) | `pnpm run publish:infra [versionTag]` (from repo root; uses `.env.local`) |
| Publish (production) | `pnpm run publish:infra:production [versionTag]` (uses `.env.production`) |
| Storage bucket | `infra-artifacts` |
| Storage path (versioned) | `themes/{versionTag}/mnky-media/mnky.css` |
| Storage path (stable latest) | `themes/latest/mnky-media/mnky.css` (written on each publish) |
| Theme assets (logo) | `assets/logo-hair.svg` (uploaded from `apps/web/public/auth/logo-hair.svg` on each publish; same-origin with theme) |
| Registry table | `public.infra_artifact_versions` (`artifact_type: 'service_theme'`, `service_id: 'mnky-media'`) |
| Optional build registry | `public.jellyfin_theme_builds`, `public.jellyfin_theme_latest` (see Optional supply chain) |
| LABZ | Platform → Artifacts shows latest theme URL per service; Service Analytics uses same data |

## Research summary and gap analysis

### Main section design system (extracted tokens)

**Grayscale (main-site.css):** `--main-gray-50` … `--main-gray-950` (HSL 0 0% lightness). Light: `--background: 0 0% 100%`, `--foreground: 0 0% 9%`, `--primary: 0 0% 25%`. Dark (`.dark .main-site`): `--background: 0 0% 6%`, `--foreground: 0 0% 98%`, `--primary: 0 0% 65%`. Layout: `--main-page-width: 1600px`, `--main-section-gap: 7rem`, `--main-section-gap-sm: 5rem`, `--main-hero-title-size`, `--main-hero-subtitle-size`, `--main-hero-min-height: 60vh`. Typography: `font-family: var(--font-main, "Roc Grotesk", var(--font-space-grotesk), system-ui, sans-serif)`.

**Glass (main-glass.css):** Blur `--main-glass-blur: 20px`, `--main-glass-blur-soft: 26px`; `--main-glass-shadow: 0 8px 32px rgba(0,0,0,0.08)`; `--main-glass-radius: 1rem`; hover `--main-card-hover-lift: 2px`, `--main-card-hover-shadow: 0 12px 40px rgba(0,0,0,0.12)`; float `--main-float-offset: -4px`, `--main-float-shadow: 0 16px 48px rgba(0,0,0,0.1)`, `--main-float-duration: 0.3s`. Light: `--main-glass-bg` rgba(255,255,255,0.12), `--main-glass-bg-card` 0.15, `--main-glass-border` rgba(0,0,0,0.06), `--main-glass-bg-nav` 0.85, `--main-glass-border-nav` 0.08. Dark: `--main-glass-bg` rgba(0,0,0,0.08), `--main-glass-bg-card` 0.12, `--main-glass-border` rgba(255,255,255,0.12), `--main-glass-bg-nav` 0.75, `--main-glass-border-nav` 0.1; fallback `--main-glass-bg-solid` (0.88 dark / 0.92 light).

**Glass hierarchy on Main:** (1) Panel default — `.main-glass-panel`. (2) Panel soft — `.main-glass-panel-soft` (section bg). (3) Panel card — `.main-glass-panel-card` (content cards). (4) Nav/footer — `.main-glass-nav`, `.main-glass-footer` use `--main-glass-bg-nav` (more opaque). Motion: `.main-float:hover` lift + shadow; `.main-btn-glass` / `.main-btn-float` same; `prefers-reduced-motion: reduce` resets transform. GQ/tech-forward: monochrome, frosted glass, high-contrast editorial, no busy backgrounds.

### Jellyfin client selectors (reference)

**In use in mnky.css:** `.backgroundContainer`, `.mainBackdrop`, `.dashboard-app-shell`, `.dashboard-header`, `.headerTop`, `.dashboard-gs-generic-item`, `.paperList .listItem`, `.cardContent`, `.sidebarContent`, `.btnPlay`, `.emby-button`, `.emby-button-primary`, `#loginPage`, `.formDialogContent`, `.readOnlyContent`, `.emby-input`, `.inputLabel`, `.formDialogLabel`, `.bodyText`, `.listItemBodyText`, `.secondary`.

**Official (Jellyfin docs):** `.playedIndicator`, `.countIndicator`, `.emby-input`, `.emby-textarea`, `.emby-select`, `.headerHomeButton`, `.headerCastButton`, `.sectionTitleContainer`, etc. Custom CSS applies to web client and Android; order of code and `!important` apply.

**To add for punch-up:** `.nowPlayingBar`, `.nowPlayingBarTop` (Now Playing bar); `.detailPage` or equivalent (detail/title page); `.sectionTitleContainer`, `.sectionTitle` (section headers); `.playedIndicator`, `.countIndicator` (grayscale); progress bar fill/bg.

### Gap analysis (mnky.css vs Main)

- **Aligned:** Tokens (--mnky-gray-*, --mnky-glass-*), background/shell/header/cards/buttons/login/inputs/typography, light/dark via `prefers-color-scheme`, float hover on cards.
- **Gaps addressed in punch-up:** (1) Stronger glass contrast (border/shadow nudge). (2) Now Playing bar styled as glass. (3) Detail page and section titles grayscale/glass. (4) Progress and played/count indicators grayscale. (5) Optional entrance animation (fade/scale) with reduced-motion respect. (6) Optional `--mnky-font` and font reference. (7) Logo override uncommented and documented in theme configurations.

## Design system mapping (Main → Jellyfin)

Main uses `.main-site` scoped tokens. Jellyfin has no such wrapper; the theme uses global `:root` (and optional `@media (prefers-color-scheme: dark)`). Map as follows:

| Main (main-site.css / main-glass.css) | Jellyfin theme `:root` / usage |
|--------------------------------------|-------------------------------|
| `--background`, `--foreground` (grayscale) | `--mnky-bg`, `--mnky-text`; background containers, body |
| `--primary`, `--primary-foreground` | `--mnky-primary`, `--mnky-primary-foreground`; buttons, links |
| `--main-gray-50` … `--main-gray-950` | `--mnky-gray-*` for borders, muted text, hierarchy |
| `--main-glass-blur`, `--main-glass-radius`, `--main-glass-shadow` | Shell, panels, nav: same names or `--mnky-glass-*` |
| `--main-glass-bg`, `--main-glass-border` | Dashboard shell, cards, header |
| `--main-glass-bg-nav`, `--main-glass-border-nav` | Header / top bar |
| `--main-glass-bg-card` | Tiles, list items, cards |
| `--main-float-offset`, `--main-float-shadow`, `--main-float-duration` | Card/tile hover lift |
| `--main-card-hover-lift`, `--main-card-hover-shadow` | Hover state on tiles |
| **New in punch-up** | Now Playing bar (`.nowPlayingBar`), detail page (`.detailPage`), section titles (`.sectionTitleContainer`), progress/indicators (`.playedIndicator`, `.countIndicator`, `.progressBar`), entrance animation (`mnky-fade-in`), `--mnky-glass-bg-card-strong`, stronger glass shadow/border in dark mode |

Typography: `--mnky-font` (default system stack; optional Space Grotesk via commented `@import`). See [JELLYFIN-THEME-CONFIGURATIONS.md](JELLYFIN-THEME-CONFIGURATIONS.md) for a full list of named theme configurations (glass-intensity, card-hover, logo, etc.) for iterative design.

## Step-by-step: edit, build, publish, use in Jellyfin

1. **Edit theme**
   - Option A: Edit `infra/service-themes/jellyfin/mnky.css` directly (tokens + primitives + overrides).
   - Option B: Edit sources in `packages/jellyfin-theme-mnky/src/`, run `pnpm -C packages/jellyfin-theme-mnky build`, then copy `dist/mnky-dojo.css` to `infra/service-themes/jellyfin/mnky.css` (or point publish script at package output).

2. **Publish**
   - From repo root: `pnpm run publish:infra [versionTag]` for **local** Supabase (uses `.env.local`), or `pnpm run publish:infra:production [versionTag]` for **production** (uses `.env.production`). Migrations only create the bucket; the script uploads the files.
   - Example: `pnpm run publish:infra:production v2` or `pnpm run publish:infra:production 10.11.6`.
   - Script uploads to `infra-artifacts`: `themes/{versionTag}/mnky-media/mnky.css` and `themes/latest/mnky-media/mnky.css`, and inserts a row into `infra_artifact_versions`.

3. **Resolve public URL**
   - **Stable (recommended):**  
     `https://<project-ref>.supabase.co/storage/v1/object/public/infra-artifacts/themes/latest/mnky-media/mnky.css`  
     This URL always serves the last published theme.
   - **Versioned:** From LABZ Platform → Artifacts (mnky-media theme URL) or by querying `infra_artifact_versions` for `service_id = 'mnky-media'`, `artifact_type = 'service_theme'`, latest `created_at`; then build URL from `storage_path`.

4. **Jellyfin Custom CSS**
   - In Jellyfin: Dashboard → General → Custom CSS set to the canonical theme URL (this project):
     ```css
     @import url("https://coevjitstmuhdhbyizpk.supabase.co/storage/v1/object/public/infra-artifacts/themes/latest/mnky-media/mnky.css");
     ```
   - For other projects, replace the host with your Supabase project reference: `https://<project-ref>.supabase.co/storage/v1/object/public/infra-artifacts/themes/latest/mnky-media/mnky.css`.

5. **CORS (required for Jellyfin @import)**
   - In Supabase Dashboard: **Storage** → select bucket **infra-artifacts** → **Configuration** (or **Settings**) → **CORS / Allowed origins**.
   - Add these origins (one per line or comma-separated, depending on UI):
     - `https://watch.moodmnky.com`
     - `https://mnky-media.moodmnky.com`
   - Save. Without this, some Jellyfin clients will block the `@import` of the theme CSS.

6. **Verify via Supabase Dashboard (optional)**
   - **Storage** → **infra-artifacts**: confirm `assets/logo-hair.svg` and `themes/latest/mnky-media/mnky.css` exist (and other theme/docker paths if published).
   - **Table Editor** → **infra_artifact_versions**: confirm rows for `artifact_type = 'service_theme'`, `service_id = 'mnky-media'` after each publish.
   - The project uses the Supabase JS client in the publish script for uploads; CORS and bucket policies are configured in the Dashboard. For local DB work, use the **supabase-local** MCP (see `.cursor/mcp.json`).

## Optional: package, vendor, and versioned supply chain

- **Package:** `packages/jellyfin-theme-mnky` contains `src/tokens.css`, `mnky-base.css`, `mnky-components.css`, `mnky-overrides.css`, and `index.css`; run `pnpm -C packages/jellyfin-theme-mnky build` to produce `dist/mnky-dojo.css`. You can copy that file to `infra/service-themes/jellyfin/mnky.css` and run `pnpm run publish:infra`, or use the Edge Function path below.
- **Vendor / reference:** `vendor/jellyfin-web/<tag>` or `vendor/ultrachromic` (or downloads to `temp/`) for selector and structure reference. See [CHAT-GPT-JELLYFIN-THEME-GUIDE.md](../CHAT-GPT-JELLYFIN-THEME-GUIDE.md). **Ultrachromic 1:1 scope:** [JELLYFIN-ULTRACHROMIC-SCOPE.md](JELLYFIN-ULTRACHROMIC-SCOPE.md) and canonical copy at [infra/service-themes/jellyfin/ultrachromic-reference/](../infra/service-themes/jellyfin/ultrachromic-reference/).
- **jellyfin_theme_builds + theme-publish + GitHub Action (implemented):**
  - **DB:** `supabase/migrations/20260327120000_jellyfin_theme_builds.sql` adds `jellyfin_theme_builds` (version, built_at, css_object_path, sha256, notes) and `jellyfin_theme_latest` (id, version, updated_at). RLS enabled; writes via service role only.
  - **Edge Function:** `supabase/functions/theme-publish/index.ts` accepts POST with HMAC headers `x-mnky-signature`, `x-mnky-timestamp` and JSON body `version`, `css_base64`, `sha256`, `set_latest`, `notes`. Uses bucket `THEME_BUCKET` (default `infra-artifacts`), writes to `themes/jellyfin-web-{version}/mnky-media/mnky.css` and `themes/latest/mnky-media/mnky.css`. Set secrets: `THEME_PUBLISH_SECRET`, optionally `THEME_BUCKET`. Deploy: `supabase functions deploy theme-publish`.
  - **GitHub Action:** `.github/workflows/jellyfin-theme-updater.yml` runs on schedule (every 6 hours) and `workflow_dispatch`. Fetches latest jellyfin/jellyfin-web release tag, builds `packages/jellyfin-theme-mnky`, then calls the theme-publish Edge Function. Secrets: `THEME_PUBLISH_URL` (e.g. `https://<project-ref>.supabase.co/functions/v1/theme-publish`), `THEME_PUBLISH_SECRET`; optional `SUPABASE_PUBLIC_CSS_BASE` (e.g. `https://<project-ref>.supabase.co/storage/v1/object/public/infra-artifacts`) to skip publish when version already exists.

### Enable the versioned supply chain (one-time)

1. **Apply migration:** Run `supabase db push` (or apply `supabase/migrations/20260327120000_jellyfin_theme_builds.sql` in the SQL editor) so `jellyfin_theme_builds` and `jellyfin_theme_latest` exist.
2. **Generate secret:** `openssl rand -hex 32` (or Node: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
3. **Supabase secrets:** In Supabase Dashboard → Project Settings → Edge Functions, or via CLI: `supabase secrets set THEME_PUBLISH_SECRET=<value>`; optionally `THEME_BUCKET=infra-artifacts`.
4. **Deploy function:** From repo root, `supabase functions deploy theme-publish`.
5. **GitHub secrets:** In the repo → Settings → Secrets and variables → Actions, add:
   - `THEME_PUBLISH_URL`: `https://<project-ref>.supabase.co/functions/v1/theme-publish`
   - `THEME_PUBLISH_SECRET`: same value as step 2
   - (Optional) `SUPABASE_PUBLIC_CSS_BASE`: `https://<project-ref>.supabase.co/storage/v1/object/public/infra-artifacts` to skip publishing when that version’s file already exists.

After this, the workflow can be run manually (Actions → Jellyfin Theme Updater → Run workflow) or will run on the schedule.

## Agents, tools, skills

- **Theme research:** Use `.cursor/commands/theme-research` (deep-thinking protocol) for strategic decisions (e.g. Ultrachromic vs pure custom, versioning strategy).
- **Design skill:** Use `.cursor/skills/design` and [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) when defining tokens and primitives so the Jellyfin theme stays aligned with Main.
- **LABZ agent:** For dashboard wiring (Platform → Artifacts, theme URL display, or future “publish from LABZ”).
- **Context7:** For up-to-date Tailwind/PostCSS/CSS docs when implementing the theme package.

## Logo override (robust method)

**Why `content: url()` often fails:** The Jellyfin logo is an `<img>` (class `.imgLogoIcon`). The CSS `content` property applies to pseudo-elements; on a replaced element like `<img>` it is unreliable and can show nothing. Loading the logo from another origin (e.g. `www.moodmnky.com` on `watch.moodmnky.com`) can also be blocked by CORS.

**Our fix:**

1. **Same-origin asset:** The logo is published to Supabase Storage at `infra-artifacts/assets/logo-hair.svg` (source: `apps/web/public/auth/logo-hair.svg`). The publish script uploads it on each run. Public URL: `https://<project-ref>.supabase.co/storage/v1/object/public/infra-artifacts/assets/logo-hair.svg`. Same origin as the theme CSS, so no CORS.
2. **Robust override (Option A):** We hide the original image and show the logo via a pseudo-element on the parent. Jellyfin-web may wrap the logo in `.headerLogo` or `.headerLeft`. The theme targets both: `.headerLogo, .headerLeft { position: relative; }`, child `.imgLogoIcon` is hidden and sized, and `::after` shows the logo. If your version uses a different wrapper (e.g. `.headerNav`), add that class to the same rules in mnky.css.
3. **Fallback (Option C):** We also set `content: url('...')` on `.imgLogoIcon` with the Supabase URL for clients where it works.

**Selectors:** `.imgLogoIcon`, `.headerLogo`, `.headerLeft`, `.headerLogo::after`, `.headerLeft::after`. Token: `--mnky-logo-url` in `:root`.

## Login page (centered glass card)

**Goal:** One clear “card” in the center of the screen: glass background, blur, border, radius, and constrained width so the form and user list feel like a single panel (Main / Ultrachromic style).

**Layout:** `#loginPage` uses `min-height: 100vh`, `display: flex`, `align-items: center`, `justify-content: center`. An optional `#loginPage::before` provides a full-page backdrop at `z-index: -1`. The main form container (one or more of `.readOnlyContent`, `.formDialogContent`, `form`, `.visualLoginForm` depending on jellyfin-web version) gets `max-width: 24em`, `width: 100%`, `margin: 0 auto`, `padding: 1.5rem`, and glass: `background: var(--mnky-glass-bg-card)`, `backdrop-filter: blur(var(--mnky-glass-blur-soft))`, `border`, `border-radius: var(--mnky-glass-radius)`, `box-shadow: var(--mnky-glass-shadow)`. An `@supports not (backdrop-filter)` fallback sets `background: var(--mnky-glass-bg-solid)`.

**Main tokens used:** `--mnky-glass-bg-card`, `--mnky-glass-blur-soft`, `--mnky-glass-border`, `--mnky-glass-radius`, `--mnky-glass-shadow`, `--mnky-glass-bg-solid`.

**Selectors to tweak:** `#loginPage`, `#loginPage::before`, `#loginPage .readOnlyContent`, `#loginPage .formDialogContent`, `#loginPage form`, `#loginPage .visualLoginForm`, `#loginPage .padded-left.padded-right.padded-bottom-page`, `#loginPage h1`, `#loginPage #divUsers .card`. If the login card style does not apply: Inspect the login page (right-click form → Inspect), find the wrapper that should be the card, add that selector in mnky.css with the same glass rules, and document it in [JELLYFIN-THEME-BASELINE.md](JELLYFIN-THEME-BASELINE.md) (Login row and Section 5).

## Jellyfin theme design checklist

- **Logo:** Use a same-origin asset (e.g. Supabase `infra-artifacts/assets/logo-hair.svg`) and a robust override (parent pseudo-element or fallback `content: url()`). See [Logo override (robust method)](#logo-override-robust-method) and [JELLYFIN-THEME-CONFIGURATIONS.md](JELLYFIN-THEME-CONFIGURATIONS.md) (logo row).
- **Login:** One centered glass card; narrow width (e.g. `max-width: 24em`), Main glass tokens, optional `#loginPage::before` backdrop. See [Login page (centered glass card)](#login-page-centered-glass-card) and theme config **login-style**.
- **CORS:** Ensure Jellyfin domains (e.g. `watch.moodmnky.com`, `mnky-media.moodmnky.com`) are allowed on the `infra-artifacts` bucket so `@import` and logo asset load.
- **Token reference:** [JELLYFIN-THEME-CONFIGURATIONS.md](JELLYFIN-THEME-CONFIGURATIONS.md) for token names and options.

## References

- [JELLYFIN-THEME-BASELINE.md](JELLYFIN-THEME-BASELINE.md) — Theme design baseline: ways to edit, tokens, extent of CSS, per-component selectors, verification
- [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) — Main section tokens (main-site.css, main-glass.css)
- [JELLYFIN-THEME-CONFIGURATIONS.md](JELLYFIN-THEME-CONFIGURATIONS.md) — Named theme configurations for design iterations
- [INFRA-STORAGE.md](INFRA-STORAGE.md) — Buckets, paths, publish script
- [SERVICES-ENV.md](SERVICES-ENV.md) — Jellyfin env vars (`JELLYFIN_BASE_URL`, `JELLYFIN_API_KEY`)
- [CHAT-GPT-JELLYFIN-THEME-GUIDE.md](../CHAT-GPT-JELLYFIN-THEME-GUIDE.md) — Full conversation and infra patterns
