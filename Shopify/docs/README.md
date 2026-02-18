# Shopify Theme Development — Cursor Documentation

This documentation describes how to use Cursor rules, commands, and MCP servers for efficient Shopify theme development.

## Documentation Index

| Document | Description |
|----------|-------------|
| [cursor-shopify-workflow.md](cursor-shopify-workflow.md) | Full workflow: rules → commands → MCP → test loop |
| [rules-reference.md](rules-reference.md) | All .mdc rules with globs, when they apply, and purpose |
| [commands-reference.md](commands-reference.md) | All custom commands with usage examples and when to use |
| [mcp-setup.md](mcp-setup.md) | MCP servers, environment variables, path notes |
| [deep-thinking-integration.md](deep-thinking-integration.md) | When to use deep-thinking; research vs. implementation |
| [shopify-cli-commands.md](shopify-cli-commands.md) | Key Shopify CLI commands for theme development |

## Quick Start

1. **Before coding**: Run `/theme-change-plan` to get a safe implementation plan.
2. **While coding**: Use `/liquid-snippet-extract` for repeated markup, `/add-section-setting` for new section options.
3. **For bugs**: Run `/fix-theme-bug` for minimal-patch guidance.
4. **Before shipping**: Run `/performance-pass` and `/accessibility-pass`.
5. **For complex decisions**: Run `/theme-research-plan` (deep-thinking protocol).

## How Rules and Commands Work

- **Project rules** (`.cursorrules`) apply to all Shopify theme work in this repo.
- **Scoped rules** (`.cursor/rules/*.mdc`) apply automatically when you open or edit files matching their `globs` (e.g. `**/*.liquid`, `sections/**/*.liquid`).
- **Custom commands** (`.cursor/commands/*.md`) are invoked by typing `/` in chat and selecting the command. They provide structured prompts for common tasks.

## Theme ↔ App Integration (mood-mnky-command)

The theme and the mood-mnky-command Next.js app integrate via **link-based CTAs** (Phase 1). The theme has no direct API dependency on the app.

### App CTA Section

- **Location**: `sections/app-cta.liquid`, `snippets/app-cta.liquid`
- **Homepage**: Added between "Why MOOD MNKY" and "MOOD|MNKY Community Blog"
- **Purpose**: Links storefront visitors to app experiences (Blending Lab, Craft, Studio)

### Configuration

1. **Theme**: In the theme customizer → **App CTA** section → set **App base URL**
   - Dev: `http://localhost:3000`
   - Prod: `https://mnky-command.moodmnky.com` (or your deployed URL)
2. **App**: Set `NEXT_PUBLIC_APP_URL` in `.env` to the same value (used by app features that need its own URL)

### App Paths

| Path     | Purpose                    |
|----------|----------------------------|
| `/blending` | Fragrance Blending Lab     |
| `/craft`    | Custom candle builder     |
| `/studio`   | Studio (audio/video)       |

### Theme App Extension (Phase 3 — Implemented)

The project includes a **Theme App Extension** (`extensions/mood-mnky-theme/`) with **four app blocks** (under **Add block → Apps**) and **one app embed** (under **Theme settings → App embeds**). See [APP-BLOCKS-BREAKDOWN.md](APP-BLOCKS-BREAKDOWN.md) for the verified list.

| Block (Add block → Apps) | Purpose | Default path / behavior |
|--------------------------|---------|--------------------------|
| **Blending Lab CTA** | Links to fragrance Blending Lab | `/blending` |
| **Latest from MNKY VERSE** | Fetches blog posts from app API | `GET /api/verse/blog`, link to `/verse/blog` |
| **Match My Mood CTA** | Links to fragrance finder / Match My Mood | `/craft` |
| **Subscription CTA** | Links to subscription experience | `/blending` |

| App embed (Theme settings → App embeds) | Purpose |
|----------------------------------------|---------|
| **MNKY Assistant** | Floating chat button; not in section block picker |

**Setup & deployment**

1. **Link app config** (creates or connects a Partner app):
   ```bash
   shopify app config link
   ```
2. **Deploy the extension**:
   ```bash
   shopify app deploy
   ```
3. **Install on store** via Partners Dashboard → Apps → Install app
4. **Add blocks in theme editor**: Theme Customizer → any section that supports app blocks → Add block → Apps → MOOD MNKY Theme

**Block settings**: Each block has an **App base URL** setting (e.g. `https://mnky-command.moodmnky.com`). Leave blank to show a disabled state.

### Future Integration (Phases 2 & 4)

- **Phase 2**: App Proxy under store domain (`store.com/app/blending`) — requires Shopify app
- **Phase 4**: Metafields + Storefront API for data sync

---

## Related Files

- [`.cursorrules`](../.cursorrules) — Project-wide rules
- [`.cursor/rules/`](../.cursor/rules/) — Scoped rules
- [`.cursor/commands/`](../.cursor/commands/) — Custom commands
- [`.cursor/mcp.json`](../.cursor/mcp.json) — MCP server configuration
