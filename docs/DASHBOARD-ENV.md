# Dashboard environment and behavior

The dashboard (`/` when logged into the app) shows stats, activity, quick actions, and Notion/Shopify status. Its behavior depends on the following environment variables and integrations.

## Environment variables

| Integration | Variables | Purpose |
|-------------|-----------|--------|
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Stats (formulas, fragrance_oils counts) and recent activity; dashboard stats API uses the admin client for accurate counts. |
| **Shopify** | `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_API_TOKEN` | Product and collection counts, LABZ pages count, recent product activity; Shopify Status card and LABZ Pages link. |
| **Notion** | `NOTION_API_KEY` (and any Notion integration env used by `lib/notion`) | Fragrance oils sync; Notion Status card, “Sync all app-wide,” and connection state. |
| **MNKY VERSE / Gamification** | `MOODMNKY_API_KEY`, optional `APP_PROXY_JWT_SECRET`, `SHOPIFY_WEBHOOK_SECRET` (or `SHOPIFY_API_SECRET`) | App Proxy JWT, orders/paid webhook verification; see `.env.example` and `docs/MNKY-VERSE-APP-PROXY-SETUP.md`. |

When Shopify or Notion is not configured, the dashboard still loads; the corresponding stat cards show “Connect … to sync” and the status cards show disconnected state. The **Connect Notion and Shopify** alert is shown when both are disconnected.

## Configuration

Dashboard layout and features are controlled by `lib/dashboard-config.ts`:

- **Section order**: Stats, optional LABZ hub card, Activity Feed, Quick Actions, Shopify Status, Notion Status. The dashboard page reads `dashboardConfig.sectionOrder` and renders sections in that order.
- **showLabzHubCard**: When `true`, the LABZ hub card is shown (sync + LABZ Pages links).
- **showConnectAlert**: When `true`, the “Connect Notion and Shopify” alert is shown when both integrations are disconnected.
- **showLabzPagesCountInStats**: When `true`, the LABZ hub card shows the LABZ pages count from the store.
- **defaultStatsRefreshInterval**: Used by the dashboard page for SWR deduping (default 30s).

Stats and Notion/Shopify cards reflect the above env; no dashboard-specific env is required beyond these. The stats API optionally returns **glossaryCount** (fragrance_notes) and **source** on each activity item (shopify | notion | supabase) for badges in the Activity Feed.
