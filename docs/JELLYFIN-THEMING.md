# Jellyfin theming (MNKY MEDIA)

This document describes how we build, publish, and serve a Jellyfin Custom CSS theme that matches the **Main** section design system (www.moodmnky.com/main): grayscale, glassmorphism, and the same tokens as `main-site.css` and `main-glass.css`. It summarizes the approach from [CHAT-GPT-JELLYFIN-THEME-GUIDE.md](../CHAT-GPT-JELLYFIN-THEME-GUIDE.md) and ties it to the repo’s existing infra.

## Summary of the ChatGPT guide

- **Where CSS lives:** Jellyfin Dashboard → General → Custom CSS. That field overrides the web client’s default CSS. Order: base Jellyfin styles → theme imports (e.g. Ultrachromic) → your custom overrides.
- **Layers:** (1) Optional base theme (e.g. Ultrachromic modules from jsDelivr or local vendor). (2) Your `:root` tokens (design system contract). (3) Primitives: background, shell, header, card, buttons, inputs, typography. (4) Page-specific overrides (login, episode list, now playing) with minimal, stable selectors.
- **Supabase as CDN:** Final CSS is hosted in Supabase Storage; Jellyfin imports it via `@import url("...")`. Use versioned or stable “latest” URLs and configure CORS for Jellyfin domains.
- **Versioning:** Optional supply chain can track jellyfin-web releases, build per version, upload via Edge Function (HMAC), and record builds in DB.

## Current state in this repo

| Item | Location / command |
|------|-------------------|
| Theme source | `infra/service-themes/jellyfin/mnky.css` |
| Publish | `pnpm run publish:infra [versionTag]` (from repo root) |
| Storage bucket | `infra-artifacts` |
| Storage path (versioned) | `themes/{versionTag}/mnky-media/mnky.css` |
| Storage path (stable latest) | `themes/latest/mnky-media/mnky.css` (written on each publish) |
| Registry table | `public.infra_artifact_versions` (`artifact_type: 'service_theme'`, `service_id: 'mnky-media'`) |
| Optional build registry | `public.jellyfin_theme_builds`, `public.jellyfin_theme_latest` (see Optional supply chain) |
| LABZ | Platform → Artifacts shows latest theme URL per service; Service Analytics uses same data |

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

Typography: optional `--mnky-font` (Roc Grotesk / Space Grotesk) if we reference a CDN or self-hosted font.

## Step-by-step: edit, build, publish, use in Jellyfin

1. **Edit theme**
   - Option A: Edit `infra/service-themes/jellyfin/mnky.css` directly (tokens + primitives + overrides).
   - Option B: Edit sources in `packages/jellyfin-theme-mnky/src/`, run `pnpm -C packages/jellyfin-theme-mnky build`, then copy `dist/mnky-dojo.css` to `infra/service-themes/jellyfin/mnky.css` (or point publish script at package output).

2. **Publish**
   - From repo root: `pnpm run publish:infra [versionTag]`.
   - Example: `pnpm run publish:infra v2` or `pnpm run publish:infra 10.11.6`.
   - Script uploads to `infra-artifacts`: `themes/{versionTag}/mnky-media/mnky.css` and `themes/latest/mnky-media/mnky.css`, and inserts a row into `infra_artifact_versions`.

3. **Resolve public URL**
   - **Stable (recommended):**  
     `https://<project-ref>.supabase.co/storage/v1/object/public/infra-artifacts/themes/latest/mnky-media/mnky.css`  
     This URL always serves the last published theme.
   - **Versioned:** From LABZ Platform → Artifacts (mnky-media theme URL) or by querying `infra_artifact_versions` for `service_id = 'mnky-media'`, `artifact_type = 'service_theme'`, latest `created_at`; then build URL from `storage_path`.

4. **Jellyfin Custom CSS**
   - In Jellyfin: Dashboard → General → Custom CSS set to:
     ```css
     @import url("https://<project-ref>.supabase.co/storage/v1/object/public/infra-artifacts/themes/latest/mnky-media/mnky.css");
     ```
   - Replace `<project-ref>` with your Supabase project reference.

5. **CORS (required for Jellyfin @import)**
   - In Supabase Dashboard: **Storage** → select bucket **infra-artifacts** → **Configuration** (or **Settings**) → **CORS / Allowed origins**.
   - Add these origins (one per line or comma-separated, depending on UI):
     - `https://watch.moodmnky.com`
     - `https://mnky-media.moodmnky.com`
   - Save. Without this, some Jellyfin clients will block the `@import` of the theme CSS.

## Optional: package, vendor, and versioned supply chain

- **Package:** `packages/jellyfin-theme-mnky` contains `src/tokens.css`, `mnky-base.css`, `mnky-components.css`, `mnky-overrides.css`, and `index.css`; run `pnpm -C packages/jellyfin-theme-mnky build` to produce `dist/mnky-dojo.css`. You can copy that file to `infra/service-themes/jellyfin/mnky.css` and run `pnpm run publish:infra`, or use the Edge Function path below.
- **Vendor / reference:** `vendor/jellyfin-web/<tag>` or `vendor/ultrachromic` (or downloads to `temp/`) for selector and structure reference. See [CHAT-GPT-JELLYFIN-THEME-GUIDE.md](../CHAT-GPT-JELLYFIN-THEME-GUIDE.md).
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

## References

- [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) — Main section tokens (main-site.css, main-glass.css)
- [INFRA-STORAGE.md](INFRA-STORAGE.md) — Buckets, paths, publish script
- [SERVICES-ENV.md](SERVICES-ENV.md) — Jellyfin env vars (`JELLYFIN_BASE_URL`, `JELLYFIN_API_KEY`)
- [CHAT-GPT-JELLYFIN-THEME-GUIDE.md](../CHAT-GPT-JELLYFIN-THEME-GUIDE.md) — Full conversation and infra patterns
