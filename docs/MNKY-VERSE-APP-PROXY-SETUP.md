# MNKY VERSE App Proxy Setup

Theme blocks (e.g. MNKY VERSE Issue Teaser) can call the mood-mnky-command backend via the Shopify App Proxy. This allows the Liquid theme to fetch issues and quests without exposing secrets.

## 1. Configure App Proxy (Shopify Partner Dashboard)

1. In [Shopify Partner Dashboard](https://partners.shopify.com) open your app **mood-mnky-command**.
2. Go to **App setup** → **App proxy** (or **Configuration** → **App proxy** depending on Partner UI).
3. Set:
   - **Subpath prefix:** `apps`
   - **Subpath:** `mnky`
   - **Proxy URL:** Your app URL that serves the proxy, e.g.  
     Production: `https://mnky-command.moodmnky.com/apps/mnky`  
     Local dev: use your ngrok URL, e.g. `https://your-subdomain.ngrok-free.app/apps/mnky`
4. Save. Requests from the storefront to `https://{shop}.myshopify.com/apps/mnky/*` will be forwarded to that URL with query params (`shop`, `path_prefix`, `signature`, `timestamp`, etc.).

**Note:** Prefix and subpath are immutable after the app is installed on a store. To change them, the merchant may need to reinstall the app.

### Optional: App proxy in `shopify.app.toml`

You can declare the proxy in config so it is applied when using Shopify CLI (e.g. `shopify app deploy`). Add:

```toml
[app_proxy]
url = "https://mnky-command.moodmnky.com/apps/mnky"
prefix = "apps"
subpath = "mnky"
```

Ensure `[access_scopes]` includes `write_app_proxy` (e.g. `scopes = "write_app_proxy"` or append to existing scopes). The `url` must match the environment (production vs dev); for multiple environments, configuring the proxy in the Partner Dashboard per environment is often easier.

## 2. Backend routes (implemented)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/apps/mnky/session` | Returns a short-lived JWT for theme JS to call other APIs. Requires `APP_PROXY_JWT_SECRET` or `MOODMNKY_API_KEY` in env. |
| GET | `/apps/mnky/api/issues` | List published issues. Query: `collection`, `status`. |
| GET | `/apps/mnky/api/quests` | List active quests. |

Theme JS can get a token from `/apps/mnky/session`, then call `/api/mag/read-event`, `/api/mag/quiz/submit`, etc. on the app with `Authorization: Bearer <token>`.

## 3. Theme block

**MNKY VERSE Issue Teaser** is in `extensions/mood-mnky-theme/blocks/mnky-verse-issue-teaser.liquid`. Add it from the Theme Editor (e.g. on collection or index). Set **App base URL** to your app URL so the CTA links to `/verse/issues`.

## 4. Optional: Metaobjects for published issues

To expose issues to the Storefront API and Liquid via metaobjects, define definitions (e.g. `mnky_issue`, `mnky_chapter`) via Admin API and implement a **Publish** action in the Verse Backoffice that writes from Supabase to Shopify metaobjects. See the plan in `temp/CHATGPT-GAMIFICATION-MANGA.md` (publish-issue-metaobjects).
