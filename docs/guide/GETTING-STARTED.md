# Getting Started with MOOD MNKY Lab

MOOD MNKY Lab is a product lab for fragrance oils, formulas, and candle-making. This guide walks you through the basics.

## Overview

The app is organized into these areas:

- **MNKY Lab** – Formulas, Fragrance Oils, Glossary, Blending Lab, Wicks & Wax, Product Builder
- **Data Sources** – Notion Sync (fragrance oils, collections)
- **Studio** – AI image generation for fragrance scenes
- **Shopify Store** – Products, orders, customers, analytics
- **Platform** – Supabase database tools

## Dashboard

After logging in, you land on the **Dashboard**. Here you'll see:

- **Stat cards** – Formulas, Fragrance Oils, Products, Collections counts
- **Activity feed** – Recent sync and product activity
- **Quick Actions** – Shortcuts to Browse Oils, Build Product, Blending Lab
- **Shopify Status** – Connection status and shop info
- **Notion Status** – Sync status for fragrance oils

## Connecting Data Sources

### Notion

Sync fragrance oils and collections from your MNKY_MIND Notion workspace:

1. Go to **Notion Sync** in the sidebar
2. Ensure your Notion integration is configured and the database is shared
3. Click **Sync** for Fragrance Oils or Collections
4. Data is pulled into Supabase and available across the app

### Shopify

Connect your Shopify store to push products and manage orders:

1. Complete the OAuth flow when prompted
2. The Dashboard shows connection status
3. Use **Product Builder** to create products and push to Shopify

## Next Steps

- [Dashboard](./DASHBOARD.md) – Explore the dashboard in detail
- [Fragrance Oils](./FRAGRANCE-OILS.md) – Browse and manage your oil catalog
- [Product Builder](./PRODUCT-BUILDER.md) – Create and push products to Shopify
