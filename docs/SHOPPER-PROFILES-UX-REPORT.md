# Comprehensive Shopper Profiles: Final UX Report

## Overview

This report documents the user experience for the **Comprehensive Shopper Profiles: Dojo + Shopify Metafields Sync** feature set. Shoppers build rich profiles in Dojo and Verse; data syncs to Shopify customer metafields for checkout personalization, email flows, and storefront targeting.

---

## User Experience Breakdown

### 1. Entry Points

| Location | Action | Result |
|----------|--------|--------|
| **Verse Profile** (`/verse/profile`) | Edit display name, bio, handle, etc. → Save | Profile updates in Supabase; if Shopify linked, metafields sync automatically |
| **Dojo Preferences** (`/dojo/preferences`) | Default agent, fragrance profile, shop preferences, wishlist, sizes, scent personality | All sync to Shopify when "Save & sync to Shopify" is clicked |
| **Verse Product Page** (`/verse/products/[handle]`) | "Add to wishlist" button | Product GID added to wishlist; syncs to Shopify immediately |

### 2. Dojo Preferences Flow

**Sections (in order):**

1. **Default agent** – Choose MOOD MNKY, SAGE MNKY, or CODE MNKY for chat/voice.
2. **Fragrance profile** – Favorite notes (comma-separated), saved blends summary, link to Blending Lab.
3. **Shop preferences** (visible when Shopify linked):
   - **Conflict banner** – If Supabase and Shopify diverge (nickname, bio, handle), shows "Profile values differ" and "Pull from Shopify".
   - **Nickname** – Preferred display name.
   - **Bio** – Short bio for personalization.
   - **Wishlist** – Add product GIDs; display and remove.
   - **Size preferences** – Clothing (XS–XXL), Candle (4–16 oz), Soap (bar/sample/travel).
   - **Scent personality** – Dropdown: Gourmand Explorer, Woodsy Adventurer, Floral Dreamer, etc.
   - **Sync status** – "Synced to Shopify at [date]" or "Not yet synced".
   - **Actions** – "Save & sync to Shopify", "Sync now", "Pull from Shopify".

### 3. Sync Behaviors

| Trigger | Behavior |
|---------|----------|
| Verse profile save (Shopify linked) | Syncs nickname, bio, verse_handle to Shopify metafields |
| Dojo "Save & sync to Shopify" | Syncs nickname, bio, fragrance_preferences, wishlist, size_preferences, scent_personality |
| Dojo "Sync now" | Same as above; refreshes data |
| Dojo "Pull from Shopify" | Fetches Shopify metafields; overwrites Supabase profile with Shopify values |
| Product "Add to wishlist" | Adds product GID; updates Supabase and Shopify immediately |

### 4. Conflict Resolution

- **Detection**: `GET /api/customer-account-api/profile?compare=1` compares Supabase profile to Shopify metafields.
- **Display**: Amber banner lists diverging fields (e.g. nickname: Supabase "Alex" vs Shopify "Alexander").
- **Resolution**: User clicks "Pull from Shopify" to accept Shopify values and update Supabase.

### 5. Data Stored

| Supabase | Shopify metafield | Sync direction |
|----------|-------------------|----------------|
| `profiles.display_name` | `custom.nickname` | ↔ |
| `profiles.bio` | `custom.bio` | ↔ |
| `profiles.handle` | `custom.verse_handle` | ↔ |
| `profiles.preferences.favorite_notes` | `custom.fragrance_preferences` (JSON) | ↔ |
| `profiles.preferences.wishlist` | `custom.wishlist` (JSON array) | ↔ |
| `profiles.preferences.size_preferences` | `custom.size_preferences` (JSON) | ↔ |
| `profiles.preferences.scent_personality` | `custom.scent_personality` | ↔ |
| `profiles.shopify_metafields_synced_at` | — | — |

---

## Technical Summary

- **APIs**: `GET/POST /api/customer-account-api/profile`, `POST /api/customer-account-api/profile/pull`, `POST /api/customer-account-api/wishlist`
- **Metafields**: `nickname`, `bio`, `verse_handle`, `fragrance_preferences`, `wishlist`, `size_preferences`, `scent_personality`
- **Setup**: Run `npm run shopify:setup-customer-metafields` to create metafield definitions

---

## Verification Checklist

1. Link Shopify account in Verse.
2. Open Dojo Preferences; fill nickname, bio, wishlist, sizes, scent personality.
3. Click "Save & sync to Shopify".
4. In Shopify Admin → Customers → [customer] → Metafields, confirm all custom metafields.
5. On a Verse product page, click "Add to wishlist"; confirm in Dojo Preferences and Shopify.
6. Manually edit a metafield in Shopify Admin; reload Dojo; confirm conflict banner and "Pull from Shopify".
