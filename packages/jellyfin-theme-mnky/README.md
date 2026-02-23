# @mnky/jellyfin-theme-mnky

Jellyfin Custom CSS theme aligned with the Main section design system (grayscale, glassmorphism). Built with PostCSS; output is a single CSS file for use in Jellyfin Dashboard → General → Custom CSS or for publishing to Supabase Storage.

## Build

```bash
pnpm -C packages/jellyfin-theme-mnky build
```

Output: `dist/mnky-dojo.css`.

## Use

- **Manual publish:** Copy `dist/mnky-dojo.css` to `infra/service-themes/jellyfin/mnky.css`, then from repo root run `pnpm run publish:infra [versionTag]`.
- **CI (optional):** GitHub Action `jellyfin-theme-updater` builds this package and calls the `theme-publish` Edge Function with the bundle.

See [docs/JELLYFIN-THEMING.md](../../docs/JELLYFIN-THEMING.md) and [docs/DESIGN-SYSTEM.md](../../docs/DESIGN-SYSTEM.md).
