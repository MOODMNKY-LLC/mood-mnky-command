# Shopify CLI Commands

Key Shopify CLI commands for theme development. Reference: [Shopify CLI for themes](https://shopify.dev/docs/storefronts/themes/tools/cli).

## Requirements

- Node.js 20.10 or higher
- npm, Yarn, or pnpm
- Git 2.28.0 or higher

## Installation

```bash
npm install -g @shopify/cli@latest
```

## Core Theme Commands

### Create a New Theme

```bash
shopify theme init
```

Clones the Skeleton theme (or another Git repo). Prompts for theme name.

### Start Development Server

```bash
shopify theme dev --store my-store
```

- Uploads theme as a development theme
- Hot reloads CSS and section changes
- Preview URL in Chrome
- First run may prompt for login

### Push Theme to Store

```bash
shopify theme push
```

Uploads local theme files to the connected store. Use `--unpublished` to push to an unpublished theme.

### Pull Theme from Store

```bash
shopify theme pull
```

Downloads a remote theme to the current directory.

### Run Theme Check

```bash
shopify theme check
```

Runs Theme Check (linter) on the theme. Detects Liquid errors, schema issues, performance problems.

### Publish a Theme

```bash
shopify theme publish
```

Sets a remote theme as the live theme. Prompts to select theme.

### Share Preview Link

```bash
shopify theme share
```

Creates a shareable, password-protected preview link.

### Package Theme

```bash
shopify theme package
```

Creates a `.zip` of the theme for distribution or upload to Theme Library.

### List Remote Themes

```bash
shopify theme list
```

Lists all themes on the connected store.

### Delete Remote Theme

```bash
shopify theme delete
```

Deletes a theme from the store. Use with care.

### Open in Admin

```bash
shopify theme open
```

Opens the theme in the Shopify admin or Online Store editor.

## Theme Directory Structure

CLI expects a standard structure. Commands like `shopify theme dev` must be run from a directory containing:

```
├── assets
├── blocks
├── config
├── layout
├── locales
├── sections
├── snippets
└── templates
```

Optional: `customers`, `metaobject`.

## Environment Variables (CI/CD)

For non-interactive use (e.g. GitHub Actions):

| Variable | Purpose |
|----------|---------|
| `SHOPIFY_CLI_THEME_TOKEN` | Theme Access password |
| `SHOPIFY_FLAG_STORE` | Store URL (e.g. my-store.myshopify.com) |
| `SHOPIFY_FLAG_FORCE` | Set to `1` to disable interactive prompts |

## Common Workflow

1. Theme is in `theme/` subfolder (already initialized)
2. `cd theme` — Enter theme directory
3. `shopify theme dev --store my-store` — Develop with hot reload
4. Make changes; preview updates automatically
5. `shopify theme check` — Lint before pushing
6. `shopify theme push` — Deploy to store
7. `shopify theme publish` — Go live (when ready)

## References

- [Shopify CLI for themes](https://shopify.dev/docs/storefronts/themes/tools/cli)
- [Create a theme](https://shopify.dev/docs/storefronts/themes/getting-started/create)
- [Customize a merchant theme](https://shopify.dev/docs/storefronts/themes/getting-started/customize)
- [Theme Check](https://shopify.dev/docs/themes/tools/theme-check)
