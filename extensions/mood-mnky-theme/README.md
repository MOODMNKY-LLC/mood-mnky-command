# MOOD MNKY Theme App Extension

Theme app extension for the mood-mnky-command storefront. It provides **app blocks** (add to sections under **Apps** in the theme editor) and one **app embed** (configured under **Theme settings → App embeds**).

## App blocks (Add block → Apps → MOOD MNKY Theme)

| Display name in editor | File | Default path / behavior |
|------------------------|------|--------------------------|
| Blending Lab CTA | `blocks/blending-cta.liquid` | `/blending` |
| Latest from MNKY VERSE | `blocks/verse-blog.liquid` | Fetches posts from app API, link to `/verse/blog` |
| Match My Mood CTA | `blocks/fragrance-finder-cta.liquid` | `/craft` |
| Subscription CTA | `blocks/subscription-cta.liquid` | `/blending` |

## App embed (Theme settings → App embeds)

| Display name in editor | File | Purpose |
|------------------------|------|---------|
| MNKY Assistant | `blocks/mnky-assistant-embed.liquid` | Floating chat button; does not appear in section block picker |

## Setup

1. From the project root, run:
   ```bash
   shopify app config link
   ```
   This creates or links a Partner app and populates `client_id` in `shopify.app.toml`.

2. Deploy:
   ```bash
   shopify app deploy
   ```

3. Install the app on your dev store (Partners Dashboard → Apps → your app → Install).

4. In the theme editor, add blocks: Theme Customizer → section → Add block → Apps → MOOD MNKY Theme.

## Block settings

Each block has:

- **App base URL** – Base URL of the mood-mnky-command app (e.g. `https://mnky-command.moodmnky.com` or `http://localhost:3000` for dev). Leave blank to show a disabled button.
- **App path** – Path appended to the base URL (e.g. `/blending`, `/craft`).
- **Heading, subheading, button label** – Content.
- **Button accessibility label** – Optional, for screen readers.
- **Use secondary button style** – Checkbox to use secondary button styling.

## Theme support

The Refresh theme (and other Online Store 2.0 themes) supports `@app` blocks in sections such as: main-product, newsletter, footer, header, featured-product, etc. App blocks appear in the block picker under **Apps → MOOD MNKY Theme**.
