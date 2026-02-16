# Shopify Theme Development

Shopify theme workspace with Cursor rules, commands, and MCP integration.

## Structure

```
Shopify/
├── theme/           # Skeleton theme (layout, sections, snippets, assets)
├── docs/            # Cursor workflow documentation
├── .cursor/         # Rules, commands, MCP config
├── .cursorrules     # Project-wide rules
└── .env             # API keys for MCP (gitignored)
```

## Quick Start

1. **Start development** (requires store connection):
   ```powershell
   cd theme
   shopify theme dev --store your-store.myshopify.com
   ```
   A preview URL will open in Chrome with hot reload.

2. **Edit in Cursor** — Open files in `theme/`. Scoped rules apply when you edit Liquid, CSS, or JS.

3. **Use commands** — Type `/` in chat:
   - `/theme-change-plan` — Plan before coding
   - `/add-section-setting` — Add section options
   - `/liquid-snippet-extract` — Extract repeated markup
   - `/fix-theme-bug` — Minimal bug fixes
   - `/performance-pass` — Performance checklist
   - `/accessibility-pass` — A11y checklist

## Documentation

See [docs/README.md](docs/README.md) for the full documentation index.

## Requirements

- Node.js 20.10+
- Shopify CLI (`npm install -g @shopify/cli@latest`)
- Shopify store (dev store or collaborator access)
